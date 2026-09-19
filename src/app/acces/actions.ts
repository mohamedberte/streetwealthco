"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ACCESS_COOKIE,
  ACCESS_VALUE,
  codesMatch,
  getExpectedAccessCode,
} from "@/lib/access";

export async function requestBoutiqueAccess(
  _prev: { error: string },
  formData: FormData,
) {
  const code = String(formData.get("code") ?? "");
  const expected = getExpectedAccessCode();

  if (!expected || !codesMatch(code, expected)) {
    return { error: "Ce code n'ouvre pas la boutique." };
  }

  const jar = await cookies();
  jar.set(ACCESS_COOKIE, ACCESS_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/boutique");
}
