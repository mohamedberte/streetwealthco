import "server-only";
import { cache } from "react";
import { company as defaults, type Company } from "@/lib/brand";
import type { VatMode } from "@/lib/vat";
import { db, unwrap } from "./db";

/**
 * Informations société et réglages de facturation. Les valeurs par défaut sont dans
 * src/lib/brand.ts ; une ligne de `site_settings` (clés `company.*` et `invoice.*`) les remplace.
 * Une facture en copie les valeurs au moment de son émission.
 */
export type InvoiceSettings = {
  vatMode: VatMode;
  /** Texte libre ajouté en pied de facture (mentions complémentaires). */
  footer: string;
};

export type Billing = { company: Company; invoice: InvoiceSettings };

export const companyFields = Object.keys(defaults) as (keyof Company)[];

const COMPANY_PREFIX = "company.";
const VAT_MODE_KEY = "invoice.vat_mode";
const FOOTER_KEY = "invoice.footer";

async function loadBilling(strict = false): Promise<Billing> {
  const billing: Billing = {
    company: { ...defaults },
    invoice: { vatMode: "destination", footer: "" },
  };
  try {
    const rows = unwrap<{ key: string; value: string }[]>(
      await db().from("site_settings").select("key, value"),
    );
    for (const row of rows) {
      const value = row.value.trim();
      if (row.key.startsWith(COMPANY_PREFIX)) {
        const field = row.key.slice(COMPANY_PREFIX.length) as keyof Company;
        if (companyFields.includes(field) && value) billing.company[field] = value;
      } else if (row.key === VAT_MODE_KEY && (value === "destination" || value === "origin")) {
        billing.invoice.vatMode = value;
      } else if (row.key === FOOTER_KEY) {
        billing.invoice.footer = value;
      }
    }
  } catch (error) {
    // Une facture est définitive : on n'émet jamais avec des valeurs par défaut si la base est illisible.
    if (strict) throw error;
    console.warn("[company] réglages indisponibles, valeurs par défaut :", error);
  }
  return billing;
}

export const getBilling = cache(() => loadBilling());

/** Mentions légales indispensables sur une facture. */
const INVOICE_REQUIRED: (keyof Company)[] = [
  "legalName",
  "legalForm",
  "shareCapital",
  "siret",
  "rcs",
  "vatNumber",
  "address",
  "postalCode",
  "city",
];

export class BillingIncompleteError extends Error {
  constructor(public missing: (keyof Company)[]) {
    super(`Informations société incomplètes : ${missing.join(", ")}`);
    this.name = "BillingIncompleteError";
  }
}

/** Mentions légales de facture encore à renseigner (vides ou entre crochets). */
export function invoiceMissingFields(company: Company) {
  return INVOICE_REQUIRED.filter((field) => {
    const value = company[field].trim();
    return value === "" || value.startsWith("[");
  });
}

/** Réglages pour émettre une facture : échoue si la base est illisible ou si une mention légale manque. */
export async function getBillingForInvoice(): Promise<Billing> {
  const billing = await loadBilling(true);
  const missing = invoiceMissingFields(billing.company);
  if (missing.length > 0) throw new BillingIncompleteError(missing);
  return billing;
}

export async function getCompany() {
  return (await getBilling()).company;
}

/** Enregistre les réglages ; une valeur vide rétablit la valeur par défaut du code. */
export async function saveBilling(company: Partial<Company>, invoice: InvoiceSettings) {
  const entries: [string, string][] = [
    ...companyFields.map((field) => [`${COMPANY_PREFIX}${field}`, (company[field] ?? "").trim()] as [string, string]),
    [VAT_MODE_KEY, invoice.vatMode],
    [FOOTER_KEY, invoice.footer.trim()],
  ];
  const filled = entries.filter(([, value]) => value !== "");
  const empty = entries.filter(([, value]) => value === "").map(([key]) => key);

  if (filled.length) {
    unwrap(
      await db()
        .from("site_settings")
        .upsert(
          filled.map(([key, value]) => ({ key, value })),
          { onConflict: "key" },
        ),
    );
  }
  if (empty.length) unwrap(await db().from("site_settings").delete().in("key", empty));
}
