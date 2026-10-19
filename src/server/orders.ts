import "server-only";
import { randomBytes } from "node:crypto";
import { getProduct, type CatalogProduct } from "./catalog";
import { policy, zones, type ZoneId } from "@/lib/shipping";
import { roundMoney, isUpcoming } from "@/lib/products";
import { formatOpening, parisDayKey } from "@/lib/paris";
import { DbError, db, unwrap } from "./db";
import { SoldOutError, ensureDefaultInventory, type StockLine } from "./inventory";

export type OrderStatus =
  | "pending_payment"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "expired"
  | "refund_needed"
  | "refunded";

export type OrderItem = {
  slug: string;
  name: string;
  size: string;
  quantity: number;
  unit_price: number;
};

export type OrderRow = {
  id: number;
  number: string;
  token: string;
  user_id: string | null;
  status: OrderStatus;
  payment_status: "unpaid" | "paid";
  payment_ref: string | null;
  email: string;
  name: string;
  phone: string;
  zone: ZoneId;
  country: string;
  city: string;
  postal_code: string;
  address: string;
  notes: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  tracking: string | null;
  carrier: string | null;
  refund_ref: string | null;
  refunded_at: Date | null;
  expires_at: Date | null;
  created_at: Date;
};

export type Order = OrderRow & { items: OrderItem[] };

export type NewOrder = {
  email: string;
  name: string;
  phone: string;
  zone: ZoneId;
  /** Code pays ISO (FR pour la zone France). */
  country: string;
  city: string;
  postalCode: string;
  address: string;
  notes?: string;
  /** Compte client connecté (null pour une commande invité). */
  userId?: string | null;
  items: { slug: string; size: string; quantity: number }[];
};

export class OrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderError";
  }
}

/** Fusionne les doublons, vérifie les pièces/tailles et plafonne les quantités. */
async function normalize(items: NewOrder["items"]) {
  const map = new Map<string, StockLine>();
  const catalog = new Map<string, CatalogProduct>();
  for (const item of items) {
    const product = catalog.get(item.slug) ?? (await getProduct(item.slug));
    if (!product || !product.sizes.includes(item.size)) {
      throw new OrderError("Une pièce de la sélection est inconnue.");
    }
    if (isUpcoming(product)) {
      throw new OrderError(
        `${product.name} ouvre à la vente le ${formatOpening(product.opensAt as string)}.`,
      );
    }
    catalog.set(item.slug, product);
    const key = `${item.slug}:${item.size}`;
    const quantity = Math.min(
      (map.get(key)?.quantity ?? 0) + item.quantity,
      policy.maxQuantity,
    );
    map.set(key, { slug: item.slug, size: item.size, quantity });
  }
  return { lines: [...map.values()], catalog };
}

export async function createOrder(input: NewOrder) {
  const { lines, catalog } = await normalize(input.items);
  if (lines.length === 0) throw new OrderError("La sélection est vide.");

  const subtotal = roundMoney(
    lines.reduce((sum, line) => sum + (catalog.get(line.slug)?.price ?? 0) * line.quantity, 0),
  );
  const shipping = zones[input.zone].fee;
  const total = roundMoney(subtotal + shipping);
  const token = randomBytes(18).toString("base64url");
  const expiresAt = new Date(Date.now() + policy.reservationMinutes * 60_000);

  await ensureDefaultInventory();
  try {
    // Réservation du stock et création de la commande dans une seule transaction (fonction SQL).
    return unwrap<{ id: number; number: string; token: string; total: number }>(
      await db().rpc("create_order", {
        p_email: input.email,
        p_name: input.name,
        p_phone: input.phone,
        p_zone: input.zone,
        p_country: input.country,
        p_city: input.city,
        p_postal_code: input.postalCode,
        p_address: input.address,
        p_notes: input.notes ?? null,
        p_subtotal: subtotal,
        p_shipping: shipping,
        p_total: total,
        p_expires_at: expiresAt.toISOString(),
        p_token: token,
        p_user_id: input.userId ?? null,
        p_items: lines.map((line) => ({
          slug: line.slug,
          size: line.size,
          quantity: line.quantity,
          name: catalog.get(line.slug)!.name,
          unit_price: catalog.get(line.slug)!.price,
        })),
      }),
    );
  } catch (error) {
    const sold = error instanceof DbError ? /SOLD_OUT\|([^|]+)\|(.+)$/.exec(error.message) : null;
    if (sold) throw new SoldOutError(sold[1], sold[2]);
    throw error;
  }
}

type RawItem = OrderItem & { id: number };
type RawOrder = Omit<OrderRow, "refunded_at" | "expires_at" | "created_at"> & {
  refunded_at: string | null;
  expires_at: string | null;
  created_at: string;
  order_items: RawItem[] | null;
};

const ORDER_SELECT = "*, order_items(id, slug, name, size, quantity, unit_price)";

function toOrder(raw: RawOrder): Order {
  const { order_items, ...rest } = raw;
  return {
    ...rest,
    refunded_at: raw.refunded_at ? new Date(raw.refunded_at) : null,
    expires_at: raw.expires_at ? new Date(raw.expires_at) : null,
    created_at: new Date(raw.created_at),
    items: [...(order_items ?? [])]
      .sort((a, b) => a.id - b.id)
      .map(({ slug, name, size, quantity, unit_price }) => ({ slug, name, size, quantity, unit_price })),
  };
}

async function findOne(column: "token" | "id" | "number", value: string | number) {
  const raw = unwrap<RawOrder | null>(
    await db().from("orders").select(ORDER_SELECT).eq(column, value).maybeSingle(),
  );
  return raw ? toOrder(raw) : null;
}

export const getOrderByToken = (token: string) => findOne("token", token);
export const getOrderById = (id: number) => findOne("id", id);
export const getOrderByNumber = (number: string) => findOne("number", number);

export async function setPaymentRef(id: number, ref: string) {
  unwrap(await db().from("orders").update({ payment_ref: ref }).eq("id", id));
}

export async function listOrders(limit = 60, status?: OrderStatus, search?: string) {
  let request = db().from("orders").select(ORDER_SELECT);
  if (status) request = request.eq("status", status);
  // On ne garde que des caractères sûrs : la valeur est insérée dans un filtre PostgREST.
  const term = (search ?? "").replace(/[^\p{L}\p{N}@.\- ]/gu, "").trim().slice(0, 60);
  if (term) request = request.or(`number.ilike.%${term}%,email.ilike.%${term}%,name.ilike.%${term}%`);
  return unwrap<RawOrder[]>(
    await request.order("created_at", { ascending: false }).limit(limit),
  ).map(toOrder);
}

/**
 * Commandes d'un compte client : celles rattachées au compte, plus les commandes invité passées
 * avec la même adresse e-mail (uniquement si cette adresse est confirmée par Supabase Auth).
 */
export async function listOrdersForUser(userId: string, verifiedEmail: string | null) {
  const byUser = unwrap<RawOrder[]>(
    await db().from("orders").select(ORDER_SELECT).eq("user_id", userId),
  );
  const byEmail = verifiedEmail
    ? unwrap<RawOrder[]>(
        await db().from("orders").select(ORDER_SELECT).eq("email", verifiedEmail.toLowerCase()),
      )
    : [];
  const merged = new Map<number, RawOrder>();
  for (const raw of [...byUser, ...byEmail]) merged.set(raw.id, raw);
  return [...merged.values()]
    .map(toOrder)
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
}

export type Stats = {
  paidOrders: number;
  revenue: number;
  revenue7d: number;
  revenue30d: number;
  toShip: number;
  refundNeeded: number;
  pending: number;
  refundedCount: number;
  refundedTotal: number;
  byProduct: { slug: string; name: string; qty: number; revenue: number }[];
};

/** Indicateurs du tableau de bord (montants TTC, livraison comprise). */
export async function dashboardStats(): Promise<Stats> {
  const t = unwrap<{
    paid_orders: number;
    revenue: number;
    revenue_7d: number;
    revenue_30d: number;
    to_ship: number;
    refund_needed: number;
    pending: number;
    refunded_count: number;
    refunded_total: number;
    by_product: { slug: string; name: string; qty: number; revenue: number }[];
  }>(await db().rpc("dashboard_stats"));
  return {
    paidOrders: Number(t.paid_orders),
    revenue: Number(t.revenue),
    revenue7d: Number(t.revenue_7d),
    revenue30d: Number(t.revenue_30d),
    toShip: Number(t.to_ship),
    refundNeeded: Number(t.refund_needed),
    pending: Number(t.pending),
    refundedCount: Number(t.refunded_count),
    refundedTotal: Number(t.refunded_total),
    byProduct: t.by_product ?? [],
  };
}

export type DailySales = { day: string; revenue: number; orders: number };

/** Ventes payées des `days` derniers jours (jours de Paris, du plus ancien à aujourd'hui, jours vides compris). */
export async function dailySales(days = 14): Promise<DailySales[]> {
  const since = new Date(Date.now() - (days + 1) * 86_400_000).toISOString();
  const rows = unwrap<{ created_at: string; total: number }[]>(
    await db()
      .from("orders")
      .select("created_at, total")
      .eq("payment_status", "paid")
      .in("status", ["confirmed", "shipped", "delivered"])
      .gte("created_at", since)
      .limit(5000),
  );

  const byDay = new Map<string, DailySales>();
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = parisDayKey(Date.now() - i * 86_400_000);
    byDay.set(day, { day, revenue: 0, orders: 0 });
  }
  for (const row of rows) {
    const entry = byDay.get(parisDayKey(new Date(row.created_at)));
    if (!entry) continue;
    entry.revenue = roundMoney(entry.revenue + Number(row.total));
    entry.orders += 1;
  }
  return [...byDay.values()];
}

/**
 * Marque une commande comme remboursée (le remboursement Stripe est déjà fait).
 * Remet les pièces en stock si demandé (retour physique) et retourne les lignes remises.
 */
export async function markRefunded(id: number, refundRef: string, restockItems: boolean) {
  return unwrap<StockLine[]>(
    await db().rpc("mark_refunded", { p_id: id, p_ref: refundRef, p_restock: restockItems }),
  );
}

export type PayResult = "paid" | "already" | "refund_needed" | "mismatch" | "not_found";

/**
 * Enregistre un paiement en ligne confirmé. Idempotent : peut être appelé
 * plusieurs fois (retour client, webhook) pour la même commande.
 */
export async function markPaid(number: string, paidAmount?: number) {
  const data = unwrap<{ result: PayResult; order_id?: number }>(
    await db().rpc("mark_paid", { p_number: number, p_amount: paidAmount ?? null }),
  );
  return { result: data.result, orderId: data.order_id };
}

/** Annule une commande et remet les pièces en stock. Retourne les lignes concernées. */
export async function cancelOrder(id: number): Promise<StockLine[]> {
  return unwrap<StockLine[]>(await db().rpc("cancel_order", { p_id: id }));
}

export async function setShipped(id: number, tracking: string | null, carrier: string | null) {
  unwrap(
    await db()
      .from("orders")
      .update({ status: "shipped", tracking, carrier, updated_at: new Date().toISOString() })
      .eq("id", id)
      .in("status", ["confirmed", "shipped"]),
  );
}

export async function setDelivered(id: number) {
  unwrap(
    await db()
      .from("orders")
      .update({ status: "delivered", updated_at: new Date().toISOString() })
      .eq("id", id)
      .in("status", ["confirmed", "shipped"]),
  );
}

export async function setStock(slug: string, size: string, stock: number) {
  unwrap(await db().rpc("set_stock", { p_slug: slug, p_size: size, p_stock: stock }));
}

export async function inventoryRows() {
  await ensureDefaultInventory();
  return unwrap<{ slug: string; size: string; stock: number; reserved: number }[]>(
    await db().from("inventory").select("slug, size, stock, reserved"),
  );
}
