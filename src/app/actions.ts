"use server";

import { z } from "zod";
import { getAnyProduct, getProduct } from "@/server/catalog";
import { policy, zoneIds, zones, type ZoneId } from "@/lib/shipping";
import { siteUrl } from "@/server/emails";
import { SoldOutError } from "@/server/inventory";
import {
  OrderError,
  cancelOrder,
  createOrder,
  getOrderById,
  setPaymentRef,
} from "@/server/orders";
import { createCheckoutSession, stripeConfigured } from "@/server/stripe";
import { clientKey, hashKey, isLimited, recordEvent } from "@/server/rate-limit";
import { addToWaitlist } from "@/server/waitlist";

export type ActionResult =
  | { ok: true; redirect: string }
  | { ok: false; error: string; soldOut?: { slug: string; size: string } };

const orderSchema = z.object({
  email: z.string().trim().email("Adresse e-mail invalide.").max(120),
  name: z.string().trim().min(2, "Nom requis.").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9 ().-]{8,20}$/, "Numéro de téléphone invalide."),
  zone: z.enum(zoneIds as [ZoneId, ...ZoneId[]]),
  address: z.string().trim().min(5, "Adresse de livraison requise.").max(200),
  postalCode: z.string().trim().min(3, "Code postal requis.").max(10),
  city: z.string().trim().min(2, "Ville requise.").max(60),
  notes: z.string().trim().max(300).optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Veuillez accepter les conditions générales de vente." }),
  }),
  items: z
    .array(
      z.object({
        slug: z.string().max(60),
        size: z.string().max(10),
        quantity: z.number().int().min(1).max(3),
      }),
    )
    .min(1, "La sélection est vide.")
    .max(10),
});

export async function placeOrder(raw: unknown): Promise<ActionResult> {
  const parsed = orderSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Informations invalides." };
  }
  const data = parsed.data;

  if (data.zone === "france" && !/^\d{5}$/.test(data.postalCode)) {
    return { ok: false, error: "Code postal français invalide (5 chiffres)." };
  }
  if (!stripeConfigured()) {
    return { ok: false, error: "Le paiement en ligne n'est pas encore activé." };
  }

  // Anti-abus : une commande réserve du stock 30 minutes, on limite donc les créations.
  const ipKey = await clientKey();
  const emailKey = hashKey(data.email.toLowerCase());
  if (
    (await isLimited("order-ip", ipKey, 8, 3600)) ||
    (await isLimited("order-email", emailKey, 5, 3600))
  ) {
    return { ok: false, error: "Trop de tentatives. Réessayez dans une heure." };
  }
  await recordEvent("order-ip", ipKey);
  await recordEvent("order-email", emailKey);

  let created: { id: number; number: string; token: string; total: number };
  try {
    created = await createOrder({
      email: data.email,
      name: data.name,
      phone: data.phone,
      zone: data.zone,
      city: data.city,
      postalCode: data.postalCode,
      address: data.address,
      notes: data.notes,
      items: data.items,
    });
  } catch (error) {
    if (error instanceof SoldOutError) {
      const product = await getAnyProduct(error.slug);
      return {
        ok: false,
        error: `${product?.name ?? "Une pièce"} (taille ${error.size}) n'est plus disponible.`,
        soldOut: { slug: error.slug, size: error.size },
      };
    }
    if (error instanceof OrderError) return { ok: false, error: error.message };
    console.error("[order] création impossible", error);
    return { ok: false, error: "Une erreur est survenue. Réessayez dans un instant." };
  }

  try {
    const order = await getOrderById(created.id);
    if (!order) throw new Error("Commande introuvable après création.");

    const session = await createCheckoutSession({
      number: order.number,
      email: order.email,
      lines: [
        ...order.items.map((item) => ({
          name: `${item.name} — taille ${item.size}`,
          quantity: item.quantity,
          unitPrice: item.unit_price,
        })),
        {
          name: `Livraison — ${zones[order.zone].label}`,
          quantity: 1,
          unitPrice: order.shipping,
        },
      ],
      successUrl: `${siteUrl()}/commande/${order.token}`,
      cancelUrl: `${siteUrl()}/`,
      expiresInMinutes: policy.reservationMinutes,
    });
    await setPaymentRef(order.id, session.id);
    return { ok: true, redirect: session.url };
  } catch (error) {
    console.error("[stripe] création de la session impossible", error);
    await cancelOrder(created.id);
    return { ok: false, error: "Le paiement en ligne est indisponible pour le moment." };
  }
}

const waitlistSchema = z.object({
  slug: z.string().max(60),
  size: z.string().max(10),
  email: z.string().trim().email("Adresse e-mail invalide.").max(120),
});

export async function joinWaitlist(raw: unknown): Promise<{ ok: boolean; error?: string }> {
  const parsed = waitlistSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Informations invalides." };
  }
  const { slug, size, email } = parsed.data;
  const product = await getProduct(slug);
  if (!product || !product.sizes.includes(size)) {
    return { ok: false, error: "Pièce inconnue." };
  }
  try {
    const ipKey = await clientKey();
    if (await isLimited("waitlist-ip", ipKey, 10, 3600)) {
      return { ok: false, error: "Trop de demandes. Réessayez plus tard." };
    }
    await recordEvent("waitlist-ip", ipKey);
    await addToWaitlist(slug, size, email);
    return { ok: true };
  } catch (error) {
    console.error("[waitlist]", error);
    return { ok: false, error: "Inscription impossible pour le moment." };
  }
}
