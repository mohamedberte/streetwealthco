import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { ACCESS_COOKIE, ACCESS_VALUE } from "@/lib/access-cookie";

export { ACCESS_COOKIE, ACCESS_VALUE };

export function getExpectedAccessCode() {
  const code = process.env.BOUTIQUE_ACCESS_CODE?.trim();
  if (code) return code;
  if (process.env.NODE_ENV !== "production") return "STREETWEALTH";
  return null;
}

export function codesMatch(input: string, expected: string) {
  const a = Buffer.from(input.normalize("NFKC").trim());
  const b = Buffer.from(expected.normalize("NFKC").trim());
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function hasBoutiqueAccess() {
  const jar = await cookies();
  return jar.get(ACCESS_COOKIE)?.value === ACCESS_VALUE;
}
