"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isAdmin } from "@/server/admin-auth";
import { companyFields, saveBilling } from "@/server/company";

const field = (max: number) => z.string().trim().max(max);

const schema = z.object({
  legalName: field(120),
  legalForm: field(80),
  shareCapital: field(40),
  siret: field(20).refine((v) => v === "" || /^\d{14}$/.test(v.replace(/\s/g, "")), "SIRET"),
  rcs: field(60),
  vatNumber: field(20).refine((v) => v === "" || /^FR[0-9A-Z]{2}\d{9}$/.test(v.replace(/\s/g, "").toUpperCase()), "TVA"),
  address: field(160),
  postalCode: field(10),
  city: field(60),
  country: field(60),
  phone: field(30),
  publisher: field(80),
  returnAddress: field(240),
  mediator: field(300),
  host: field(200),
  footer: field(240),
  vatMode: z.enum(["destination", "origin"]),
});

/** Informations société et réglages de facture : copiés dans chaque facture à son émission. */
export async function saveBillingAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");

  const raw = Object.fromEntries(
    [...companyFields, "footer", "vatMode"].map((name) => [name, String(formData.get(name) ?? "")]),
  );
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/admin/societe?error=invalid&field=${String(parsed.error.issues[0]?.path[0] ?? "form")}`);
  }
  const { footer, vatMode, ...company } = parsed.data;
  // Formats normalisés pour l'impression (espaces propres, TVA en majuscules).
  company.siret = company.siret.replace(/\s/g, "").replace(/^(\d{3})(\d{3})(\d{3})(\d{5})$/, "$1 $2 $3 $4");
  company.vatNumber = company.vatNumber.replace(/\s/g, "").toUpperCase();

  await saveBilling(company, { vatMode, footer });
  revalidatePath("/", "layout");
  redirect("/admin/societe?notice=billing_saved");
}
