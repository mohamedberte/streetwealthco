import "server-only";
import { brand } from "@/lib/brand";
import { formatPrice } from "@/lib/products";
import { getAnyProduct } from "./catalog";
import { countryName, zones } from "@/lib/shipping";
import { sendMail } from "./mail";
import type { Order } from "./orders";
import { unsubscribeToken } from "./unsubscribe";

export function siteUrl() {
  const url = process.env.SITE_URL;
  if (!url) {
    // En production, une URL absente enverrait les clients vers localhost : on échoue explicitement.
    if (process.env.NODE_ENV === "production") throw new Error("SITE_URL manquante.");
    return "http://localhost:3000";
  }
  return url.replace(/\/$/, "");
}

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function layout(title: string, body: string) {
  return `<!doctype html><html lang="fr"><body style="margin:0;padding:32px;background:#E8D8C0;color:#24150F;font-family:Helvetica,Arial,sans-serif;">
<div style="max-width:520px;margin:0 auto;background:#FAF8F3;padding:32px;border:1px solid #CDBB9F;">
<p style="margin:0 0 24px;font-size:20px;letter-spacing:6px;">${brand.name}</p>
<h1 style="margin:0 0 16px;font-size:20px;font-weight:500;">${title}</h1>
${body}
<p style="margin:32px 0 0;font-size:12px;color:#75685D;">${brand.tagline}</p>
</div></body></html>`;
}

function summary(order: Order) {
  const rows = order.items
    .map(
      (item) =>
        `<tr><td style="padding:6px 0;">${escape(item.name)} — ${escape(item.size)} × ${item.quantity}</td><td style="padding:6px 0;text-align:right;">${formatPrice(item.unit_price * item.quantity)}</td></tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}
<tr><td style="padding:6px 0;color:#75685D;">Livraison — ${zones[order.zone].label}</td><td style="padding:6px 0;text-align:right;">${formatPrice(order.shipping)}</td></tr>
<tr><td style="padding:10px 0 0;border-top:1px solid #CDBB9F;"><strong>Total</strong></td><td style="padding:10px 0 0;border-top:1px solid #CDBB9F;text-align:right;"><strong>${formatPrice(order.total)}</strong></td></tr></table>`;
}

function trackLink(order: Order) {
  const url = `${siteUrl()}/commande/${order.token}`;
  return `<p style="margin:24px 0 0;"><a href="${url}" style="color:#A9844F;">Suivre ma commande</a></p>`;
}

export async function sendOrderConfirmation(order: Order) {
  await sendMail({
    to: order.email,
    subject: `Commande ${order.number} confirmée`,
    html: layout(
      `Commande ${order.number} confirmée`,
      `<p style="font-size:14px;">Bonjour ${escape(order.name)}, votre paiement est bien reçu et votre commande est enregistrée. Livraison estimée : ${zones[order.zone].delay}.</p>${summary(order)}<p style="font-size:12px;color:#75685D;">Vous disposez de 14 jours à compter de la réception pour exercer votre droit de rétractation.</p>${trackLink(order)}`,
    ),
  });
}

export async function sendShippedEmail(order: Order) {
  const tracking = order.tracking
    ? `<p style="font-size:14px;">Suivi : ${escape(order.tracking)}</p>`
    : "";
  await sendMail({
    to: order.email,
    subject: `Commande ${order.number} expédiée`,
    html: layout(
      `Votre commande est en route`,
      `<p style="font-size:14px;">Commande ${order.number} expédiée vers ${escape(order.postal_code)} ${escape(order.city)}, ${escape(countryName(order.country))}.</p>${tracking}${trackLink(order)}`,
    ),
  });
}

export async function sendRestockEmail(email: string, slug: string, size: string) {
  const product = await getAnyProduct(slug);
  if (!product) return;
  const unsubscribe = `${siteUrl()}/api/waitlist/unsubscribe?e=${encodeURIComponent(email)}&p=${encodeURIComponent(slug)}&s=${encodeURIComponent(size)}&t=${unsubscribeToken(email, slug, size)}`;
  await sendMail({
    to: email,
    subject: `${product.name} — taille ${size} de nouveau disponible`,
    html: layout(
      "De nouveau disponible",
      `<p style="font-size:14px;">${escape(product.name)} en taille ${escape(size)} est de nouveau disponible. Les pièces sont attribuées dans l'ordre d'inscription, dans la limite du stock.</p>
<p style="margin:24px 0 0;"><a href="${siteUrl()}/?piece=${product.slug}" style="color:#A9844F;">Voir la pièce</a></p>
<p style="margin:24px 0 0;font-size:11px;color:#75685D;"><a href="${unsubscribe}" style="color:#75685D;">Ne plus recevoir cette alerte</a></p>`,
    ),
  });
}

export async function sendRefundEmail(order: Order) {
  await sendMail({
    to: order.email,
    subject: `Commande ${order.number} remboursée`,
    html: layout(
      "Remboursement effectué",
      `<p style="font-size:14px;">Bonjour ${escape(order.name)}, votre commande ${order.number} a été intégralement remboursée (${formatPrice(order.total)}). Le montant est crédité sur votre moyen de paiement d'origine sous 5 à 10 jours ouvrés, selon votre banque.</p>`,
    ),
  });
}

export async function sendAdminNotification(order: Order) {
  const to = process.env.ADMIN_EMAIL;
  if (!to) return;
  await sendMail({
    to,
    subject: `Nouvelle commande ${order.number} — ${formatPrice(order.total)}`,
    html: layout(
      `Nouvelle commande ${order.number}`,
      `<p style="font-size:14px;">${escape(order.name)} — ${escape(order.phone)}<br>${escape(order.address)}, ${escape(order.postal_code)} ${escape(order.city)}, ${escape(countryName(order.country))} (${zones[order.zone].label})</p>${summary(order)}`,
    ),
  });
}

export async function sendRefundNeededNotification(order: Order) {
  const to = process.env.ADMIN_EMAIL;
  if (!to) return;
  await sendMail({
    to,
    subject: `Remboursement à effectuer — ${order.number}`,
    html: layout(
      `Remboursement à effectuer`,
      `<p style="font-size:14px;">Le paiement de ${order.number} (${formatPrice(order.total)}) est arrivé alors que le stock n'était plus disponible. Rembourser le client depuis l'espace admin (bouton Rembourser) : le remboursement Stripe et le statut de la commande sont mis à jour ensemble.</p>`,
    ),
  });
}
