import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "triplex_admin";
const MAX_AGE = 60 * 60 * 8; // 8 heures

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 16) {
    throw new Error("ADMIN_SESSION_SECRET manquante ou trop courte (16 caractères minimum).");
  }
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkPassword(candidate: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Comparaison sur des empreintes pour ne pas révéler la longueur.
  const hash = (v: string) => createHmac("sha256", "pwd").update(v).digest("hex");
  return safeEqual(hash(candidate), hash(expected));
}

export async function startAdminSession() {
  const expires = Date.now() + MAX_AGE * 1000;
  const payload = String(expires);
  const store = await cookies();
  store.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: MAX_AGE,
  });
}

export async function endAdminSession() {
  const store = await cookies();
  store.delete({ name: COOKIE, path: "/admin" });
}

export async function isAdmin() {
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) return false;
  const store = await cookies();
  const value = store.get(COOKIE)?.value;
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;
  if (!safeEqual(sign(payload), signature)) return false;
  return Number(payload) > Date.now();
}
