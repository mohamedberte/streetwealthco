"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TRACKING_PATTERN, carrierLabel, isCarrierId } from "@/lib/carriers";
import { DROP_SIZE, isUpcoming } from "@/lib/products";
import { getAnyProduct } from "@/server/catalog";
import { isAdmin } from "@/server/admin-auth";
import { isAdminUser, sessionClient } from "@/server/auth";
import { sendDeliveredEmail, sendRefundEmail, sendShippedEmail, type MailDocument } from "@/server/emails";
import { BillingIncompleteError } from "@/server/company";
import { INVOICEABLE, getInvoiceForOrder, issueCreditNote, issueInvoice } from "@/server/invoices";
import { logOrderEvent } from "@/server/order-events";
import {
  cancelOrder,
  getOrderById,
  markRefunded,
  setDelivered,
  setShipped,
  setStock,
} from "@/server/orders";
import { clientKey, isLimited, recordEvent } from "@/server/rate-limit";
import { refundPayment } from "@/server/stripe";
import { notifyDrop, notifyWaitlist, removeWaitlistEntry } from "@/server/waitlist";

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin");
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const password = String(formData.get("password") ?? "").slice(0, 200);
  const key = await clientKey();
  // 5 échecs maximum par 15 minutes et par visiteur.
  if (await isLimited("admin-login", key, 5, 15 * 60)) redirect("/admin?error=locked");

  const supabase = await sessionClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !isAdminUser(data.user)) {
    // Un compte client qui tente l'admin est déconnecté de cette session.
    if (!error) await supabase.auth.signOut();
    await recordEvent("admin-login", key);
    // Ralentit les essais répétés.
    await new Promise((resolve) => setTimeout(resolve, 800));
    redirect("/admin?error=1");
  }
  redirect("/admin");
}

export async function logout() {
  await (await sessionClient()).auth.signOut();
  redirect("/admin");
}

export async function shipOrder(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  const tracking = String(formData.get("tracking") ?? "").trim().slice(0, 40) || null;
  const carrierInput = String(formData.get("carrier") ?? "");
  const carrier = isCarrierId(carrierInput) ? carrierInput : null;
  // Un numéro de suivi sert à fabriquer un lien : on refuse les valeurs douteuses.
  if (tracking && !TRACKING_PATTERN.test(tracking)) {
    redirect(`/admin/commandes/${id}?error=tracking`);
  }
  const before = await getOrderById(id);
  if (!before || !(["confirmed", "shipped"] as string[]).includes(before.status)) return;
  await setShipped(id, tracking, carrier);
  const order = await getOrderById(id);
  if (order && order.status === "shipped") {
    const detail = [carrierLabel(carrier), tracking].filter(Boolean).join(" · ") || null;
    // Le client n'est prévenu qu'à la première expédition ; une mise à jour du suivi est seulement notée.
    await logOrderEvent(id, "shipped", detail, "admin");
    if (before.status === "confirmed") await sendShippedEmail(order);
  }
  revalidatePath("/admin", "layout");
}

export async function deliverOrder(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  const before = await getOrderById(id);
  if (!before || !(["confirmed", "shipped"] as string[]).includes(before.status)) return;
  await setDelivered(id);
  await logOrderEvent(id, "delivered", null, "admin");
  const order = await getOrderById(id);
  if (order) await sendDeliveredEmail(order);
  revalidatePath("/admin", "layout");
}

export async function cancelOrderAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  // Une commande payée ne s'annule pas sans remboursement : voir refundOrderAction.
  const order = await getOrderById(id);
  if (!order || order.payment_status === "paid") return;
  const lines = await cancelOrder(id);
  await logOrderEvent(id, "cancelled", null, "admin");
  // Les pièces remises en stock peuvent débloquer des personnes en attente.
  for (const line of lines) await notifyWaitlist(line.slug, line.size);
  revalidatePath("/admin", "layout");
}

export async function updateStock(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "");
  const size = String(formData.get("size") ?? "");
  const stock = Number(formData.get("stock"));
  const product = await getAnyProduct(slug);
  if (!product || !product.sizes.includes(size)) return;
  if (!Number.isInteger(stock) || stock < 0 || stock > 10_000) return;
  await setStock(slug, size, stock);
  await notifyWaitlist(slug, size);
  revalidatePath("/admin", "layout");
}

/** Rembourse intégralement une commande payée via Stripe, puis met à jour la commande. */
export async function refundOrderAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || formData.get("confirm") !== "yes") return;
  const restockItems = formData.get("restock") === "yes";

  const order = await getOrderById(id);
  const refundable = ["confirmed", "shipped", "delivered", "refund_needed"];
  if (!order || !order.payment_ref || order.payment_status !== "paid") return;
  if (!refundable.includes(order.status)) return;

  let refundRef: string;
  try {
    refundRef = await refundPayment(order.payment_ref, order.number);
  } catch (error) {
    console.error("[refund] échec", error);
    redirect("/admin/commandes?notice=refund_failed");
  }

  const restocked = await markRefunded(id, refundRef, restockItems);
  for (const line of restocked) await notifyWaitlist(line.slug, line.size);
  await logOrderEvent(id, "refunded", restockItems ? "Pièces remises en stock" : null, "admin");

  // Avoir : uniquement si une facture avait été émise ; un échec n'empêche pas d'informer le client.
  let creditNote: MailDocument | null = null;
  try {
    const issued = await issueCreditNote(order);
    if (issued) creditNote = { number: issued.number, pdf: issued.pdf };
  } catch (error) {
    console.error("[invoice] avoir impossible", error);
    await logOrderEvent(id, "note", "Avoir non émis : à émettre depuis la commande");
  }
  await sendRefundEmail(order, creditNote);
  revalidatePath("/admin", "layout");
}

/** Note interne sur une commande (jamais visible par le client). */
export async function addOrderNoteAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  if (!Number.isInteger(id) || !note || !(await getOrderById(id))) return;
  await logOrderEvent(id, "note", note, "admin");
  revalidatePath(`/admin/commandes/${id}`);
}

/** Émet la facture d'une commande payée qui n'en a pas (commande antérieure ou échec d'émission). */
export async function issueInvoiceAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  const order = await getOrderById(id);
  if (!order || order.payment_status !== "paid" || !INVOICEABLE.includes(order.status)) return;
  try {
    await issueInvoice(order);
  } catch (error) {
    console.error("[invoice] émission manuelle impossible", error);
    redirect(`/admin/commandes/${id}?error=${error instanceof BillingIncompleteError ? "company" : "invoice"}`);
  }
  revalidatePath(`/admin/commandes/${id}`);
  redirect(`/admin/commandes/${id}?notice=invoice`);
}

/** Émet l'avoir d'une commande remboursée qui n'en a pas (échec lors du remboursement). */
export async function issueCreditNoteAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  const order = await getOrderById(id);
  if (!order || order.status !== "refunded") return;
  if (await getInvoiceForOrder(id, "credit_note")) return;
  try {
    const issued = await issueCreditNote(order);
    if (issued) await sendRefundEmail(order, { number: issued.number, pdf: issued.pdf });
  } catch (error) {
    console.error("[invoice] avoir manuel impossible", error);
    redirect(`/admin/commandes/${id}?error=invoice`);
  }
  revalidatePath(`/admin/commandes/${id}`);
  redirect(`/admin/commandes/${id}?notice=credit_note`);
}

export async function removeWaitlistAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await removeWaitlistEntry(id);
  revalidatePath("/admin", "layout");
}

export async function notifyWaitlistAction(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "");
  const size = String(formData.get("size") ?? "");
  const product = await getAnyProduct(slug);
  if (!product) return;
  if (size === DROP_SIZE) {
    // Alerte d'ouverture : uniquement une fois la vente ouverte.
    if (isUpcoming(product)) return;
    await notifyDrop(slug);
  } else {
    if (!product.sizes.includes(size)) return;
    await notifyWaitlist(slug, size);
  }
  revalidatePath("/admin", "layout");
}
