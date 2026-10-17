"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAnyProduct } from "@/server/catalog";
import {
  checkPassword,
  endAdminSession,
  isAdmin,
  startAdminSession,
} from "@/server/admin-auth";
import { sendRefundEmail, sendShippedEmail } from "@/server/emails";
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
import { notifyWaitlist, removeWaitlistEntry } from "@/server/waitlist";

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin");
}

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "").slice(0, 200);
  const key = await clientKey();
  // 5 échecs maximum par 15 minutes et par visiteur.
  if (await isLimited("admin-login", key, 5, 15 * 60)) redirect("/admin?error=locked");
  if (!checkPassword(password)) {
    await recordEvent("admin-login", key);
    // Ralentit les essais répétés.
    await new Promise((resolve) => setTimeout(resolve, 800));
    redirect("/admin?error=1");
  }
  await startAdminSession();
  redirect("/admin");
}

export async function logout() {
  await endAdminSession();
  redirect("/admin");
}

export async function shipOrder(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const tracking = String(formData.get("tracking") ?? "").trim().slice(0, 120) || null;
  if (!Number.isInteger(id)) return;
  await setShipped(id, tracking);
  const order = await getOrderById(id);
  if (order && order.status === "shipped") await sendShippedEmail(order);
  revalidatePath("/admin");
}

export async function deliverOrder(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await setDelivered(id);
  revalidatePath("/admin");
}

export async function cancelOrderAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  // Une commande payée ne s'annule pas sans remboursement : voir refundOrderAction.
  const order = await getOrderById(id);
  if (!order || order.payment_status === "paid") return;
  const lines = await cancelOrder(id);
  // Les pièces remises en stock peuvent débloquer des personnes en attente.
  for (const line of lines) await notifyWaitlist(line.slug, line.size);
  revalidatePath("/admin");
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
  revalidatePath("/admin");
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
    redirect("/admin?notice=refund_failed");
  }

  const restocked = await markRefunded(id, refundRef, restockItems);
  for (const line of restocked) await notifyWaitlist(line.slug, line.size);
  await sendRefundEmail(order);
  revalidatePath("/admin");
}

export async function removeWaitlistAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await removeWaitlistEntry(id);
  revalidatePath("/admin");
}

export async function notifyWaitlistAction(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "");
  const size = String(formData.get("size") ?? "");
  const product = await getAnyProduct(slug);
  if (!product || !product.sizes.includes(size)) return;
  await notifyWaitlist(slug, size);
  revalidatePath("/admin");
}
