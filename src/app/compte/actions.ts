"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { currentUser, isAdminUser, sessionClient } from "@/server/auth";
import { db } from "@/server/db";
import { clientKey, isLimited, recordEvent } from "@/server/rate-limit";

const email = z.string().trim().toLowerCase().email().max(120);
const password = z.string().min(10).max(72);

/** 10 tentatives par 15 minutes et par visiteur pour toutes les actions d'authentification. */
async function tooMany() {
  const key = await clientKey();
  if (await isLimited("account-auth", key, 10, 15 * 60)) return true;
  await recordEvent("account-auth", key);
  return false;
}

export async function signUp(formData: FormData) {
  if (await tooMany()) redirect("/compte?m=limite");
  const parsed = z
    .object({ email, password })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) redirect("/compte?m=invalide");
  if (formData.get("consent") !== "on") redirect("/compte?m=consent");

  const supabase = await sessionClient();
  const { error } = await supabase.auth.signUp(parsed.data);
  if (error) {
    console.error("[auth] inscription refusée", error.message);
    redirect("/compte?m=invalide");
  }
  // Même réponse que l'adresse existe déjà ou non (pas d'énumération de comptes).
  redirect("/compte?m=inscrit");
}

export async function signIn(formData: FormData) {
  if (await tooMany()) redirect("/compte?m=limite");
  const supabase = await sessionClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 120),
    password: String(formData.get("password") ?? "").slice(0, 200),
  });
  if (error) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    redirect("/compte?m=echec");
  }
  redirect("/compte");
}

export async function signOut() {
  await (await sessionClient()).auth.signOut();
  redirect("/compte");
}

export async function forgotPassword(formData: FormData) {
  if (await tooMany()) redirect("/compte?m=limite");
  const parsed = email.safeParse(formData.get("email"));
  if (parsed.success) {
    const { error } = await (await sessionClient()).auth.resetPasswordForEmail(parsed.data);
    if (error) console.error("[auth] réinitialisation impossible", error.message);
  }
  redirect("/compte?m=reinit");
}

export async function updatePassword(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/compte?m=lien");
  const parsed = password.safeParse(formData.get("password"));
  if (!parsed.success) redirect("/compte/mot-de-passe?m=invalide");
  const { error } = await (await sessionClient()).auth.updateUser({ password: parsed.data });
  if (error) redirect("/compte/mot-de-passe?m=invalide");
  redirect("/compte?m=mdp");
}

/** Suppression du compte (RGPD) : mot de passe redemandé ; les commandes sont conservées, détachées du compte. */
export async function deleteAccount(formData: FormData) {
  const user = await currentUser();
  if (!user || !user.email) redirect("/compte");
  // Un compte administrateur ne se supprime pas depuis cette page.
  if (isAdminUser(user)) redirect("/compte?m=admin");
  if (await tooMany()) redirect("/compte?m=limite");

  const supabase = await sessionClient();
  const check = await supabase.auth.signInWithPassword({
    email: user.email,
    password: String(formData.get("password") ?? "").slice(0, 200),
  });
  if (check.error || check.data.user?.id !== user.id) redirect("/compte?m=suppression-echec");

  const { error } = await db().auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[auth] suppression de compte impossible", error.message);
    redirect("/compte?m=suppression-echec");
  }
  await supabase.auth.signOut();
  redirect("/compte?m=supprime");
}
