import "server-only";
import { brand } from "@/lib/brand";
import { toCents } from "@/lib/products";
import { countryName, zones } from "@/lib/shipping";
import { SELLER_COUNTRY, formatCents, formatRate, splitVat, vatRateFor, type VatMode } from "@/lib/vat";
import { getBillingForInvoice } from "./company";
import { db, unwrap } from "./db";
import { documentKey, isDocumentStorageConfigured, loadDocument, storeDocument } from "./document-storage";
import { logOrderEvent } from "./order-events";
import type { Order } from "./orders";
import { renderInvoice, type BuyerSnapshot, type InvoiceDocument, type InvoiceLine, type SellerSnapshot } from "./pdf";

export type InvoiceKind = "invoice" | "credit_note";

/** Statuts pour lesquels une facture peut être émise (vente réellement conclue, non remboursée). */
export const INVOICEABLE: Order["status"][] = ["confirmed", "shipped", "delivered"];

/** Vendeur figé à l'émission, avec les réglages utiles à l'impression. */
export type StoredSeller = SellerSnapshot & { footer: string; vatMode: VatMode };

export type InvoiceRow = {
  id: number;
  kind: InvoiceKind;
  number: string;
  order_id: number;
  related_id: number | null;
  issued_at: Date;
  country: string;
  vat_rate: number;
  total_ht: number;
  total_vat: number;
  total_ttc: number;
  seller: StoredSeller;
  buyer: BuyerSnapshot;
  lines: InvoiceLine[];
  pdf_key: string | null;
};

/** Document émis, avec son PDF déjé rendu (évite de le relire ou de le rendre une seconde fois). */
export type IssuedDocument = InvoiceRow & { pdf: Uint8Array };

type RawInvoice = Omit<InvoiceRow, "issued_at" | "vat_rate"> & { issued_at: string; vat_rate: number | string };

const toInvoice = (raw: RawInvoice): InvoiceRow => ({
  ...raw,
  issued_at: new Date(raw.issued_at),
  vat_rate: Number(raw.vat_rate),
});

export async function getInvoiceById(id: number) {
  const raw = unwrap<RawInvoice | null>(await db().from("invoices").select("*").eq("id", id).maybeSingle());
  return raw ? toInvoice(raw) : null;
}

export async function getInvoiceForOrder(orderId: number, kind: InvoiceKind) {
  const raw = unwrap<RawInvoice | null>(
    await db().from("invoices").select("*").eq("order_id", orderId).eq("kind", kind).maybeSingle(),
  );
  return raw ? toInvoice(raw) : null;
}

/** Numéros de facture/avoir par commande (page Compte). */
export async function invoiceNumbersByOrder(orderIds: number[]) {
  const map = new Map<number, { invoice?: string; creditNote?: string }>();
  if (orderIds.length === 0) return map;
  const rows = unwrap<{ order_id: number; kind: InvoiceKind; number: string }[]>(
    await db().from("invoices").select("order_id, kind, number").in("order_id", orderIds),
  );
  for (const row of rows) {
    const entry = map.get(row.order_id) ?? {};
    if (row.kind === "invoice") entry.invoice = row.number;
    else entry.creditNote = row.number;
    map.set(row.order_id, entry);
  }
  return map;
}

/** Documents émis entre deux dates (export comptable), du plus ancien au plus récent. */
export async function listInvoicesBetween(from: Date, to: Date) {
  const rows = unwrap<(RawInvoice & { orders: { number: string } | null })[]>(
    await db()
      .from("invoices")
      .select("*, orders(number)")
      .gte("issued_at", from.toISOString())
      .lt("issued_at", to.toISOString())
      .order("issued_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(5001),
  );
  return rows.map((row) => ({ ...toInvoice(row), orderNumber: row.orders?.number ?? "" }));
}

function buildLines(order: Order, rate: number): InvoiceLine[] {
  const entries = [
    ...order.items.map((item) => ({
      label: `${item.name} - taille ${item.size}`,
      quantity: item.quantity,
      unitTtc: toCents(item.unit_price),
    })),
    { label: `Livraison - ${zones[order.zone].label}`, quantity: 1, unitTtc: toCents(order.shipping) },
  ];
  return entries.map(({ label, quantity, unitTtc }) => {
    // TTC = prix payé (inchangé quel que soit le pays) ; HT et TVA en sont déduits sur le total de la ligne.
    const totalTtc = unitTtc * quantity;
    const totalHt = splitVat(totalTtc, rate).ht;
    return {
      label,
      quantity,
      unitHt: splitVat(unitTtc, rate).ht,
      totalHt,
      totalVat: totalTtc - totalHt,
      totalTtc,
    };
  });
}

const sum = (lines: InvoiceLine[], key: "totalHt" | "totalVat" | "totalTtc") =>
  lines.reduce((total, line) => total + line[key], 0);

function vatNote(seller: StoredSeller, country: string, rate: number) {
  if (country === SELLER_COUNTRY) return `TVA française au taux de ${formatRate(rate)}.`;
  if (seller.vatMode === "origin") {
    return `TVA française appliquée (seuil de 10 000 EUR de ventes à distance intra-UE non dépassé).`;
  }
  return `TVA du pays de livraison (${countryName(country)}) au taux de ${formatRate(rate)} : vente à distance à un consommateur de l'Union européenne, déclarée via le guichet unique (OSS).`;
}

async function renderRow(row: InvoiceRow) {
  const credit = row.kind === "credit_note";
  const order = unwrap<{ number: string; created_at: string } | null>(
    await db().from("orders").select("number, created_at").eq("id", row.order_id).maybeSingle(),
  );
  const paid = credit
    ? null
    : unwrap<{ created_at: string } | null>(
        await db()
          .from("order_events")
          .select("created_at")
          .eq("order_id", row.order_id)
          .eq("type", "paid")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
      );
  const paidAt = paid ? new Date(paid.created_at) : row.issued_at;
  const related =
    credit && row.related_id
      ? unwrap<{ number: string } | null>(
          await db().from("invoices").select("number").eq("id", row.related_id).maybeSingle(),
        )
      : null;

  const document: InvoiceDocument = {
    kind: row.kind,
    number: row.number,
    issuedAt: row.issued_at,
    orderNumber: order?.number ?? "",
    orderedAt: order ? new Date(order.created_at) : row.issued_at,
    relatedNumber: related?.number,
    seller: row.seller,
    buyer: row.buyer,
    lines: row.lines,
    vatRate: row.vat_rate,
    vatNote: vatNote(row.seller, row.country, row.vat_rate),
    totalHt: row.total_ht,
    totalVat: row.total_vat,
    totalTtc: row.total_ttc,
    paymentNote: credit
      ? `Remboursement de ${formatCents(-row.total_ttc)} effectué sur le moyen de paiement d'origine.`
      : `Facture acquittée : payée en ligne le ${paidAt.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}.`,
    footer: row.seller.footer,
  };
  return renderInvoice(document);
}

/** Archive le PDF dans S3 s'il ne l'est pas encore ; un échec n'est que journalisé. */
async function archive(row: InvoiceRow, pdf: Uint8Array) {
  if (row.pdf_key || !isDocumentStorageConfigured()) return row;
  try {
    const key = documentKey(row.number);
    await storeDocument(key, pdf);
    unwrap(await db().from("invoices").update({ pdf_key: key }).eq("id", row.id));
    return { ...row, pdf_key: key };
  } catch (error) {
    console.error(`[invoice] archivage S3 impossible pour ${row.number}`, error);
    return row;
  }
}

/** PDF d'un document : copie archivée dans S3, sinon régénéré à l'identique depuis la base. */
export async function getInvoicePdf(row: InvoiceRow): Promise<Uint8Array> {
  if (row.pdf_key) {
    try {
      const stored = await loadDocument(row.pdf_key);
      if (stored) return stored;
    } catch (error) {
      console.error(`[invoice] lecture S3 impossible pour ${row.number}`, error);
    }
  }
  const pdf = await renderRow(row);
  // Au passage, on archive les documents qui ne l'étaient pas encore.
  if (!row.pdf_key) await archive(row, pdf);
  return pdf;
}

async function issue(order: Order, kind: InvoiceKind, original: InvoiceRow | null): Promise<IssuedDocument> {
  const credit = kind === "credit_note";
  let seller: StoredSeller;
  let buyer: BuyerSnapshot;
  let lines: InvoiceLine[];
  let rate: number;
  let country: string;

  if (credit) {
    if (!original) throw new Error("Avoir sans facture d'origine.");
    // L'avoir reprend la facture à l'identique (remboursement intégral), montants en négatif.
    seller = original.seller;
    buyer = original.buyer;
    rate = original.vat_rate;
    country = original.country;
    lines = original.lines.map((line) => ({
      ...line,
      unitHt: -line.unitHt,
      totalHt: -line.totalHt,
      totalVat: -line.totalVat,
      totalTtc: -line.totalTtc,
    }));
  } else {
    const { company, invoice } = await getBillingForInvoice();
    seller = { ...company, brandName: brand.name, email: brand.email, footer: invoice.footer, vatMode: invoice.vatMode };
    buyer = {
      name: order.name,
      address: order.address,
      postalCode: order.postal_code,
      city: order.city,
      country: countryName(order.country),
      email: order.email,
    };
    country = order.country;
    rate = vatRateFor(country, invoice.vatMode);
    lines = buildLines(order, rate);
  }

  const totalTtc = sum(lines, "totalTtc");
  if (Math.abs(totalTtc) !== toCents(order.total)) {
    throw new Error(`Total de la facture incohérent avec la commande ${order.number}.`);
  }

  const created = unwrap<{ id: number; number: string; created: boolean }>(
    await db().rpc("issue_document", {
      p_order_id: order.id,
      p_kind: kind,
      p_related_id: original?.id ?? null,
      p_country: country,
      p_vat_rate: rate,
      p_total_ht: sum(lines, "totalHt"),
      p_total_vat: sum(lines, "totalVat"),
      p_total_ttc: totalTtc,
      p_seller: seller,
      p_buyer: buyer,
      p_lines: lines,
    }),
  );

  const row = await getInvoiceById(created.id);
  if (!row) throw new Error("Document introuvable après émission.");
  if (created.created) await logOrderEvent(order.id, kind === "invoice" ? "invoice" : "credit_note", row.number);
  // Le PDF n'est rendu qu'une fois ; l'archivage S3 (timeout court) ne bloque jamais la suite.
  const pdf = row.pdf_key ? await getInvoicePdf(row) : await renderRow(row);
  return { ...(await archive(row, pdf)), pdf };
}

/** Émet la facture d'une commande payée (idempotent : renvoie la facture existante le cas échéant). */
export async function issueInvoice(order: Order) {
  if (order.payment_status !== "paid" || !INVOICEABLE.includes(order.status)) {
    throw new Error("Commande non facturable.");
  }
  return issue(order, "invoice", null);
}

/** Émet l'avoir d'un remboursement intégral ; null si la commande n'avait pas de facture. */
export async function issueCreditNote(order: Order) {
  const original = await getInvoiceForOrder(order.id, "invoice");
  if (!original) return null;
  return issue(order, "credit_note", original);
}
