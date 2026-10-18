import "server-only";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import type { Company } from "@/lib/brand";
import { policy } from "@/lib/shipping";
import { formatCents, formatRate } from "@/lib/vat";

/**
 * Génération des documents PDF (facture, avoir, bon de préparation, bordereau de retour) avec
 * pdf-lib. Polices standard PDF (Helvetica, jeu WinAnsi) : les caractères hors jeu (ł, č, ő…) sont
 * remplacés par leur lettre de base pour ne jamais faire échouer un document.
 */

export type SellerSnapshot = Company & { brandName: string; email: string };
export type BuyerSnapshot = {
  name: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  email: string;
};

/** Montants en centimes (négatifs sur un avoir). */
export type InvoiceLine = {
  label: string;
  quantity: number;
  unitHt: number;
  totalHt: number;
  totalVat: number;
  totalTtc: number;
};

export type InvoiceDocument = {
  kind: "invoice" | "credit_note";
  number: string;
  issuedAt: Date;
  orderNumber: string;
  orderedAt: Date;
  /** Numéro de la facture d'origine (avoir). */
  relatedNumber?: string;
  seller: SellerSnapshot;
  buyer: BuyerSnapshot;
  lines: InvoiceLine[];
  vatRate: number;
  vatNote: string;
  totalHt: number;
  totalVat: number;
  totalTtc: number;
  paymentNote: string;
  footer: string;
};

export type SlipItem = { name: string; size: string; quantity: number };

export type PackingSlipData = {
  orderNumber: string;
  orderedAt: Date;
  seller: SellerSnapshot;
  shipTo: BuyerSnapshot & { phone: string };
  zoneLabel: string;
  carrier: string | null;
  tracking: string | null;
  notes: string | null;
  items: SlipItem[];
};

export type ReturnSlipData = {
  orderNumber: string;
  orderedAt: Date;
  seller: SellerSnapshot;
  customer: BuyerSnapshot;
  items: SlipItem[];
};

const W = 595.28;
const H = 841.89;
const M = 48;
const INK = rgb(0.141, 0.082, 0.059);
const GOLD = rgb(0.663, 0.518, 0.31);
const MUTED = rgb(0.459, 0.408, 0.365);
const BORDER = rgb(0.804, 0.733, 0.624);
const CREAM = rgb(0.953, 0.922, 0.867);

const SPECIAL: Record<string, string> = {
  ł: "l",
  Ł: "L",
  đ: "d",
  Đ: "D",
  ı: "i",
  ħ: "h",
  "\u2011": "-",
  "\u202f": " ",
  "\u2009": " ",
};

const GREEK: Record<string, string> = {
  α: "a", β: "v", γ: "g", δ: "d", ε: "e", ζ: "z", η: "i", θ: "th", ι: "i", κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o",
  π: "p", ρ: "r", σ: "s", ς: "s", τ: "t", υ: "y", φ: "f", χ: "ch", ψ: "ps", ω: "o",
};
const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh",
  щ: "sht", ъ: "a", ь: "y", ю: "yu", я: "ya",
};

/** Translittère grec et cyrillique (adresses grecques et bulgares) : lisible plutôt que des « ? ». */
function transliterate(ch: string) {
  const lower = ch.toLowerCase();
  const latin = GREEK[lower] ?? CYRILLIC[lower];
  if (!latin) return undefined;
  return ch === lower ? latin : latin[0].toUpperCase() + latin.slice(1);
}

const fmtDate = (date: Date) =>
  date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Paris" });

type TextOptions = {
  size?: number;
  bold?: boolean;
  color?: ReturnType<typeof rgb>;
  align?: "left" | "right";
};

class Sheet {
  private page!: PDFPage;
  /** Position verticale courante, mesurée depuis le haut de la page. */
  y = M;
  private readonly cache = new Map<string, string>();

  private constructor(
    readonly doc: PDFDocument,
    private readonly regular: PDFFont,
    private readonly boldFont: PDFFont,
  ) {
    this.addPage();
  }

  static async create(title: string) {
    const doc = await PDFDocument.create();
    doc.setTitle(title);
    doc.setProducer("TRIPLEX");
    doc.setCreator("TRIPLEX");
    return new Sheet(
      doc,
      await doc.embedFont(StandardFonts.Helvetica),
      await doc.embedFont(StandardFonts.HelveticaBold),
    );
  }

  addPage() {
    this.page = this.doc.addPage([W, H]);
    this.y = M;
  }

  /** Passe à une nouvelle page s'il ne reste pas `space` points avant le pied de page. */
  ensure(space: number) {
    if (this.y + space > H - 90) this.addPage();
  }

  private safe(text: string) {
    const clean = text.replace(/[\r\n\t]+/g, " ").normalize("NFC");
    const encodes = (value: string) => {
      try {
        this.regular.encodeText(value);
        return true;
      } catch {
        return false;
      }
    };
    let out = "";
    for (const ch of clean) {
      let mapped = this.cache.get(ch);
      if (mapped === undefined) {
        if (encodes(ch)) mapped = ch;
        else {
          const base = ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          mapped = SPECIAL[ch] ?? (base !== ch && encodes(base) ? base : (transliterate(base) ?? "?"));
        }
        this.cache.set(ch, mapped);
      }
      out += mapped;
    }
    return out;
  }

  width(text: string, size = 9, bold = false) {
    return (bold ? this.boldFont : this.regular).widthOfTextAtSize(this.safe(text), size);
  }

  /** Dessine `text` à (x, y) ; avec align « right », x est le bord droit. */
  text(text: string, x: number, y: number, options: TextOptions = {}) {
    const { size = 9, bold = false, color = INK, align = "left" } = options;
    const safe = this.safe(text);
    const font = bold ? this.boldFont : this.regular;
    const left = align === "right" ? x - font.widthOfTextAtSize(safe, size) : x;
    this.page.drawText(safe, { x: left, y: H - y - size, size, font, color });
  }

  /** Coupe un mot plus long que la ligne (e-mail, adresse) pour qu'il ne déborde pas de la page. */
  private breakWord(word: string, maxWidth: number, size: number, bold: boolean) {
    const pieces: string[] = [];
    let current = "";
    for (const ch of word) {
      if (current && this.width(current + ch, size, bold) > maxWidth) {
        pieces.push(current);
        current = ch;
      } else {
        current += ch;
      }
    }
    if (current) pieces.push(current);
    return pieces;
  }

  wrap(text: string, maxWidth: number, size = 9, bold = false) {
    const lines: string[] = [];
    for (const paragraph of text.split("\n")) {
      let current = "";
      for (const raw of paragraph.split(/\s+/).filter(Boolean)) {
        const pieces = this.width(raw, size, bold) > maxWidth ? this.breakWord(raw, maxWidth, size, bold) : [raw];
        for (const word of pieces) {
          const next = current ? `${current} ${word}` : word;
          if (current && this.width(next, size, bold) > maxWidth) {
            lines.push(current);
            current = word;
          } else {
            current = next;
          }
        }
      }
      lines.push(current);
    }
    return lines;
  }

  /** Paragraphe retourné à la ligne ; avance le curseur et renvoie le nombre de lignes. */
  paragraph(text: string, x: number, maxWidth: number, options: TextOptions & { gap?: number } = {}) {
    const { size = 9, bold = false, gap = 3 } = options;
    const lines = this.wrap(text, maxWidth, size, bold);
    for (const line of lines) {
      this.ensure(size + gap);
      this.text(line, x, this.y, options);
      this.y += size + gap;
    }
    return lines.length;
  }

  rule(y = this.y, color = BORDER) {
    this.page.drawLine({ start: { x: M, y: H - y }, end: { x: W - M, y: H - y }, thickness: 0.6, color });
  }

  fill(y: number, height: number, color = CREAM, x = M, width = W - M * 2) {
    this.page.drawRectangle({ x, y: H - y - height, width, height, color });
  }

  box(x: number, y: number, size: number) {
    this.page.drawRectangle({ x, y: H - y - size, width: size, height: size, borderColor: INK, borderWidth: 0.8 });
  }

  /** Pied de page sur chaque page : identité du vendeur, mentions et pagination. */
  footers(seller: SellerSnapshot, extra: string) {
    const pages = this.doc.getPages();
    const identity = [
      `${seller.legalName} - ${seller.legalForm} au capital de ${seller.shareCapital}`,
      `SIRET ${seller.siret} - RCS ${seller.rcs} - TVA intracommunautaire ${seller.vatNumber}`,
      `${seller.address}, ${seller.postalCode} ${seller.city}, ${seller.country} - ${seller.email}`,
    ];
    pages.forEach((page, index) => {
      this.page = page;
      const y = H - 78;
      this.rule(y - 6);
      identity.forEach((line, i) => {
        this.text(line, W / 2 - this.width(line, 7.5) / 2, y + i * 10, { size: 7.5, color: MUTED });
      });
      if (extra) {
        const lines = this.wrap(extra, W - M * 2 - 80, 7.5).slice(0, 2);
        lines.forEach((line, i) => this.text(line, M, y + 34 + i * 10, { size: 7.5, color: MUTED }));
      }
      this.text(`Page ${index + 1} / ${pages.length}`, W - M, y + 34, { size: 7.5, color: MUTED, align: "right" });
    });
  }

  async save() {
    return this.doc.save();
  }
}

function block(sheet: Sheet, title: string, lines: string[], x: number, y: number, width: number) {
  sheet.text(title.toUpperCase(), x, y, { size: 7.5, color: GOLD, bold: true });
  let cursor = y + 14;
  lines.filter(Boolean).forEach((line, index) => {
    for (const wrapped of sheet.wrap(line, width, 9.5, index === 0)) {
      sheet.text(wrapped, x, cursor, { size: 9.5, bold: index === 0 });
      cursor += 12.5;
    }
  });
  return cursor;
}

const sellerLines = (s: SellerSnapshot) => [
  s.legalName,
  `${s.legalForm} - capital ${s.shareCapital}`,
  s.address,
  `${s.postalCode} ${s.city}`,
  s.country,
  `SIRET ${s.siret}`,
  `TVA ${s.vatNumber}`,
];

const buyerLines = (b: BuyerSnapshot) => [b.name, b.address, `${b.postalCode} ${b.city}`, b.country, b.email];

function brandHeader(sheet: Sheet, seller: SellerSnapshot, title: string, meta: string[]) {
  sheet.text(seller.brandName, M, M, { size: 22, bold: true });
  sheet.text(title, W - M, M, { size: 16, bold: true, color: GOLD, align: "right" });
  meta.forEach((line, index) => sheet.text(line, W - M, M + 24 + index * 12, { size: 9, align: "right" }));
  sheet.y = M + 24 + Math.max(meta.length, 3) * 12 + 14;
  sheet.rule();
  sheet.y += 18;
}

/** Facture ou avoir. Les montants d'un avoir sont négatifs. */
export async function renderInvoice(data: InvoiceDocument) {
  const credit = data.kind === "credit_note";
  const sheet = await Sheet.create(`${credit ? "Avoir" : "Facture"} ${data.number}`);

  brandHeader(sheet, data.seller, credit ? "AVOIR" : "FACTURE", [
    `N° ${data.number}`,
    `Date : ${fmtDate(data.issuedAt)}`,
    `Commande : ${data.orderNumber} du ${fmtDate(data.orderedAt)}`,
    ...(data.relatedNumber ? [`Facture d'origine : ${data.relatedNumber}`] : []),
  ]);

  const top = sheet.y;
  const left = block(sheet, "Émetteur", sellerLines(data.seller), M, top, 220);
  const right = block(sheet, "Facturé et livré à", buyerLines(data.buyer), W / 2 + 20, top, W / 2 - M - 20);
  sheet.y = Math.max(left, right) + 20;

  // En-tête du tableau.
  const cols = { label: M + 6, qty: 300, unit: 362, rate: 405, ht: 468, ttc: W - M - 6 };
  sheet.fill(sheet.y, 22);
  const headY = sheet.y + 7;
  sheet.text("Désignation", cols.label, headY, { size: 8, bold: true });
  sheet.text("Qté", cols.qty, headY, { size: 8, bold: true, align: "right" });
  sheet.text("P.U. HT", cols.unit, headY, { size: 8, bold: true, align: "right" });
  sheet.text("TVA", cols.rate, headY, { size: 8, bold: true, align: "right" });
  sheet.text("Total HT", cols.ht, headY, { size: 8, bold: true, align: "right" });
  sheet.text("Total TTC", cols.ttc, headY, { size: 8, bold: true, align: "right" });
  sheet.y += 30;

  for (const line of data.lines) {
    const label = sheet.wrap(line.label, cols.qty - cols.label - 40, 9);
    sheet.ensure(label.length * 12 + 10);
    const rowY = sheet.y;
    label.forEach((part, index) => sheet.text(part, cols.label, rowY + index * 12, { size: 9 }));
    sheet.text(String(line.quantity), cols.qty, rowY, { align: "right" });
    sheet.text(formatCents(line.unitHt), cols.unit, rowY, { align: "right" });
    sheet.text(formatRate(data.vatRate), cols.rate, rowY, { align: "right" });
    sheet.text(formatCents(line.totalHt), cols.ht, rowY, { align: "right" });
    sheet.text(formatCents(line.totalTtc), cols.ttc, rowY, { align: "right" });
    sheet.y += label.length * 12 + 6;
    sheet.rule(sheet.y - 2);
    sheet.y += 4;
  }

  // Totaux.
  sheet.ensure(80);
  sheet.y += 10;
  const labelX = 380;
  const rows: [string, string, boolean][] = [
    ["Total HT", formatCents(data.totalHt), false],
    [`TVA ${formatRate(data.vatRate)}`, formatCents(data.totalVat), false],
    [credit ? "Total TTC remboursé" : "Total TTC", formatCents(data.totalTtc), true],
  ];
  rows.forEach(([label, value, strong]) => {
    if (strong) sheet.fill(sheet.y - 4, 20, CREAM, labelX - 8, W - M - labelX + 8);
    sheet.text(label, labelX, sheet.y, { size: strong ? 10.5 : 9.5, bold: strong });
    sheet.text(value, W - M - 6, sheet.y, { size: strong ? 10.5 : 9.5, bold: strong, align: "right" });
    sheet.y += strong ? 22 : 15;
  });

  sheet.y += 14;
  sheet.paragraph(data.paymentNote, M, W - M * 2, { size: 9 });
  sheet.paragraph(data.vatNote, M, W - M * 2, { size: 8.5, color: MUTED });

  sheet.footers(data.seller, data.footer);
  return sheet.save();
}

function itemsTable(sheet: Sheet, items: SlipItem[], lastColumn: string) {
  sheet.fill(sheet.y, 22);
  const headY = sheet.y + 7;
  sheet.text("Article", M + 6, headY, { size: 8, bold: true });
  sheet.text("Taille", 330, headY, { size: 8, bold: true });
  sheet.text("Qté", 395, headY, { size: 8, bold: true, align: "right" });
  sheet.text(lastColumn, W - M - 6, headY, { size: 8, bold: true, align: "right" });
  sheet.y += 32;
  for (const item of items) {
    sheet.ensure(28);
    const rowY = sheet.y;
    sheet.paragraph(item.name, M + 6, 260, { size: 10 });
    sheet.text(item.size, 330, rowY, { size: 10 });
    sheet.text(String(item.quantity), 395, rowY, { size: 10, align: "right" });
    sheet.box(W - M - 24, rowY - 1, 13);
    sheet.rule(sheet.y + 4);
    sheet.y += 14;
  }
}

/** Bon de préparation : liste de colisage et adresse d'expédition, sans prix. */
export async function renderPackingSlip(data: PackingSlipData) {
  const sheet = await Sheet.create(`Bon de préparation ${data.orderNumber}`);
  brandHeader(sheet, data.seller, "BON DE PRÉPARATION", [
    `Commande : ${data.orderNumber}`,
    `Passée le ${fmtDate(data.orderedAt)}`,
    data.zoneLabel,
  ]);

  const top = sheet.y;
  const left = block(
    sheet,
    "Expédier à",
    [...buyerLines(data.shipTo).slice(0, 4), `Tél. ${data.shipTo.phone}`],
    M,
    top,
    240,
  );
  const right = block(
    sheet,
    "Expédition",
    [
      data.carrier ?? "Transporteur à choisir",
      data.tracking ? `Suivi : ${data.tracking}` : "Suivi : à saisir dans l'admin",
    ],
    W / 2 + 20,
    top,
    W / 2 - M - 20,
  );
  sheet.y = Math.max(left, right) + 20;

  itemsTable(sheet, data.items, "Préparé");

  const pieces = data.items.reduce((sum, item) => sum + item.quantity, 0);
  sheet.y += 6;
  sheet.text(`${pieces} pièce${pieces > 1 ? "s" : ""} à préparer`, M, sheet.y, { size: 10, bold: true });
  sheet.y += 24;

  if (data.notes) {
    sheet.text("NOTE DU CLIENT", M, sheet.y, { size: 7.5, bold: true, color: GOLD });
    sheet.y += 14;
    sheet.paragraph(data.notes, M, W - M * 2, { size: 10 });
  }

  sheet.footers(data.seller, "");
  return sheet.save();
}

/** Bordereau de retour avec le modèle de formulaire de rétractation (annexe de la directive 2011/83/UE). */
export async function renderReturnSlip(data: ReturnSlipData) {
  const sheet = await Sheet.create(`Bordereau de retour ${data.orderNumber}`);
  brandHeader(sheet, data.seller, "BORDEREAU DE RETOUR", [
    `Commande : ${data.orderNumber}`,
    `Passée le ${fmtDate(data.orderedAt)}`,
  ]);

  const top = sheet.y;
  const left = block(sheet, "Retourner à", [data.seller.legalName, ...data.seller.returnAddress.split(/,\s*/)], M, top, 240);
  const right = block(sheet, "Client", buyerLines(data.customer).slice(0, 4), W / 2 + 20, top, W / 2 - M - 20);
  sheet.y = Math.max(left, right) + 18;

  itemsTable(sheet, data.items, "À retourner");

  sheet.y += 8;
  sheet.text("CONDITIONS DE RETOUR", M, sheet.y, { size: 7.5, bold: true, color: GOLD });
  sheet.y += 14;
  sheet.paragraph(
    `Vous disposez de ${policy.withdrawalDays} jours à compter de la réception pour vous rétracter, sans motif. ` +
      `Renvoyez la pièce neuve, non portée, non lavée, avec ses étiquettes, dans les ${policy.withdrawalDays} jours suivant ` +
      `votre décision. Les frais de retour sont à votre charge. Le remboursement intervient au plus tard ` +
      `${policy.withdrawalDays} jours après réception de votre décision, par le moyen de paiement initial.`,
    M,
    W - M * 2,
    { size: 9 },
  );

  sheet.y += 14;
  sheet.ensure(190);
  sheet.rule();
  sheet.y += 14;
  sheet.text("FORMULAIRE DE RÉTRACTATION", M, sheet.y, { size: 10, bold: true });
  sheet.y += 18;
  sheet.paragraph(
    `À l'attention de ${data.seller.legalName}, ${data.seller.address}, ${data.seller.postalCode} ${data.seller.city}, ${data.seller.email} :`,
    M,
    W - M * 2,
    { size: 9.5 },
  );
  sheet.paragraph(
    `Je vous notifie par la présente ma rétractation du contrat portant sur la vente du ou des biens ci-dessus ` +
      `(commande ${data.orderNumber} passée le ${fmtDate(data.orderedAt)}, reçue le ____ / ____ / ________).`,
    M,
    W - M * 2,
    { size: 9.5 },
  );
  sheet.y += 4;
  sheet.paragraph(`Nom : ${data.customer.name}`, M, W - M * 2, { size: 9.5 });
  sheet.paragraph(
    `Adresse : ${data.customer.address}, ${data.customer.postalCode} ${data.customer.city}, ${data.customer.country}`,
    M,
    W - M * 2,
    { size: 9.5 },
  );
  sheet.y += 10;
  sheet.text("Date : ____ / ____ / ________", M, sheet.y, { size: 9.5 });
  sheet.text("Signature :", 330, sheet.y, { size: 9.5 });

  sheet.footers(data.seller, "");
  return sheet.save();
}
