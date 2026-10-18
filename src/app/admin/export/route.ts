import { isAdmin } from "@/server/admin-auth";
import { listInvoicesBetween } from "@/server/invoices";

export const dynamic = "force-dynamic";

/** Neutralise l'injection de formules tableur et protège les séparateurs. */
const text = (value: string) => {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
};

/** Centimes → « -12,34 » (virgule décimale, lisible directement par Excel en français). */
const amount = (cents: number) => `${cents < 0 ? "-" : ""}${Math.floor(Math.abs(cents) / 100)},${String(Math.abs(cents) % 100).padStart(2, "0")}`;

const day = (date: Date) => date.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });

const MAX_ROWS = 5000;

/** Minuit (heure de Paris) du 1er jour du mois donné (mois 0-11), exprimé en date UTC. */
function parisMonthStart(year: number, monthIndex: number) {
  const guess = new Date(Date.UTC(year, monthIndex, 1));
  const part = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", timeZoneName: "shortOffset" })
    .formatToParts(guess)
    .find((p) => p.type === "timeZoneName")?.value;
  // « GMT+2 » : le changement d'heure n'a jamais lieu un 1er du mois, le décalage est donc celui de minuit.
  const hours = Number(/GMT([+-]\d+)/.exec(part ?? "")?.[1] ?? 1);
  return new Date(guess.getTime() - hours * 3_600_000);
}

/**
 * Export comptable des factures et avoirs d'un mois (?periode=2026-10) ou d'une année (?periode=2026),
 * en années et mois civils de Paris comme la numérotation. Réservé à l'admin ; sans paramètre, le mois courant.
 */
export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response("Non autorisé", { status: 401 });

  const periode =
    new URL(request.url).searchParams.get("periode") ??
    new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" }).slice(0, 7);

  let from: Date;
  let to: Date;
  const month = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(periode);
  const year = /^(\d{4})$/.exec(periode);
  if (month) {
    const y = Number(month[1]);
    const m = Number(month[2]) - 1;
    from = parisMonthStart(y, m);
    to = m === 11 ? parisMonthStart(y + 1, 0) : parisMonthStart(y, m + 1);
  } else if (year) {
    from = parisMonthStart(Number(year[1]), 0);
    to = parisMonthStart(Number(year[1]) + 1, 0);
  } else {
    return new Response("Période invalide", { status: 400 });
  }

  const rows = await listInvoicesBetween(from, to);
  if (rows.length > MAX_ROWS) {
    return new Response("Trop de documents pour un seul export : choisissez une période plus courte.", { status: 413 });
  }
  const header = ["Date", "Type", "Numéro", "Commande", "Client", "Pays", "Taux TVA %", "Total HT", "TVA", "Total TTC"];
  const lines = rows.map((row) =>
    [
      day(row.issued_at),
      row.kind === "invoice" ? "Facture" : "Avoir",
      row.number,
      row.orderNumber,
      row.buyer.name,
      row.country,
      String(row.vat_rate).replace(".", ","),
      amount(row.total_ht),
      amount(row.total_vat),
      amount(row.total_ttc),
    ].map((cell, index) => ([4, 2, 3].includes(index) ? text(cell) : cell)),
  );

  const csv = "\uFEFF" + [header, ...lines].map((line) => line.join(";")).join("\r\n") + "\r\n";
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="triplex-factures-${periode}.csv"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
