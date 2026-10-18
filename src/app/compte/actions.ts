"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { ZoneId } from "@/lib/shipping";
import { currentUser, isAdminUser, sessionClient } from "@/server/auth";
import { db } from "@/server/db";
import { listOrdersForUser } from "@/server/orders";
import { clientKey, hashKey, isLimited, recordEvent } from "@/server/rate-limit";

const email = z.string().trim().toLowerCase().email().max(120);
const code = z.string().trim().regex(/^\d{6,10}$/);

export type StepResult = { ok: true } | { ok: false; error: string };

/** Compte la tentative et renvoie true si le visiteur (ou l'adresse) dépasse la limite. */
async function limited(kind: string, max: number, seconds: number, extra?: string) {
  const keys = [await clientKey(), ...(extra ? [hashKey(extra)] : [])];
  for (const key of keys) {
    if (await isLimited(kind, key, max, seconds)) return true;
  }
  for (const key of keys) await recordEvent(kind, key);
  return false;
}

/**
 * Connexion et création de compte en un seul geste : un code à usage unique est envoyé par
 * e-mail (aucun mot de passe). Le compte est créé au premier code valide.
 */
export async function sendCode(raw: string): Promise<StepResult> {
  const parsed = email.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Adresse e-mail invalide." };
  if (await limited("account-code", 8, 3600, parsed.data)) {
    return { ok: false, error: "Trop de demandes. Réessayez dans une heure." };
  }
  const { error } = await (await sessionClient()).auth.signInWithOtp({
    email: parsed.data,
    options: { shouldCreateUser: true },
  });
  if (error) {
    console.error("[auth] envoi du code impossible", error.message);
    return { ok: false, error: "Envoi impossible pour le moment. Réessayez dans un instant." };
  }
  // Même réponse que le compte existe ou non (pas d'énumération de comptes).
  return { ok: true };
}

export async function verifyCode(rawEmail: string, rawCode: string): Promise<StepResult> {
  const parsedEmail = email.safeParse(rawEmail);
  const parsedCode = code.safeParse(rawCode);
  if (!parsedEmail.success || !parsedCode.success) {
    return { ok: false, error: "Code invalide." };
  }
  if (await limited("account-verify", 10, 15 * 60, parsedEmail.data)) {
    return { ok: false, error: "Trop de tentatives. Réessayez dans 15 minutes." };
  }
  const { error } = await (await sessionClient()).auth.verifyOtp({
    email: parsedEmail.data,
    token: parsedCode.data,
    type: "email",
  });
  if (error) return { ok: false, error: "Code incorrect ou expiré." };
  return { ok: true };
}

export async function signOut() {
  await (await sessionClient()).auth.signOut();
  redirect("/compte");
}

/** Coordonnées de la dernière commande, pour pré-remplir le paiement d'un client connecté. */
export type CheckoutProfile = {
  email: string;
  name: string;
  phone: string;
  zone: ZoneId;
  country: string;
  address: string;
  postalCode: string;
  city: string;
};

export async function checkoutProfile(): Promise<CheckoutProfile | null> {
  const user = await currentUser();
  if (!user?.email) return null;
  const last = (await listOrdersForUser(user.id, user.email_confirmed_at ? user.email : null))[0];
  return {
    email: user.email,
    name: last?.name ?? "",
    phone: last?.phone ?? "",
    zone: last?.zone ?? "france",
    country: last?.country ?? "FR",
    address: last?.address ?? "",
    postalCode: last?.postal_code ?? "",
    city: last?.city ?? "",
  };
}

/** Suppression du compte (RGPD) : saisie de « SUPPRIMER » ; les commandes sont conservées, détachées du compte. */
export async function deleteAccount(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/compte");
  // Un compte administrateur ne se supprime pas depuis cette page.
  if (isAdminUser(user)) redirect("/compte?m=admin");
  if (await limited("account-delete", 5, 15 * 60)) redirect("/compte?m=limite");
  if (String(formData.get("confirm") ?? "").trim().toUpperCase() !== "SUPPRIMER") {
    redirect("/compte?m=suppression-echec");
  }

  const { error } = await db().auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[auth] suppression de compte impossible", error.message);
    redirect("/compte?m=suppression-echec");
  }
  await (await sessionClient()).auth.signOut();
  redirect("/compte?m=supprime");
}
