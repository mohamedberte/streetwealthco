"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProduct } from "@/lib/products";
import {
  checkPassword,
  endAdminSession,
  isAdmin,
  startAdminSession,
} from "@/server/admin-auth";
import { sendShippedEmail } from "@/server/emails";
import {
  cancelOrder,
  getOrderById,
  setDelivered,
  setShipped,
  setStock,
} from "@/server/orders";
import { notifyWaitlist } from "@/server/waitlist";

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin");
}

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
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
  const product = getProduct(slug);
  if (!product || !product.sizes.includes(size)) return;
  if (!Number.isInteger(stock) || stock < 0 || stock > 10_000) return;
  await setStock(slug, size, stock);
  await notifyWaitlist(slug, size);
  revalidatePath("/admin");
}
