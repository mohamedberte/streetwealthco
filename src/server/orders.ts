import "server-only";
import { randomBytes } from "node:crypto";
import { getProduct, type CatalogProduct } from "./catalog";
import { policy, zones, type ZoneId } from "@/lib/shipping";
import { query, transaction, type Queryable } from "./db";
import {
  SoldOutError,
  commitDirect,
  commitReserved,
  releaseExpired,
  releaseReserved,
  reserve,
  restock,
  type StockLine,
} from "./inventory";

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
  status: OrderStatus;
  payment_status: "unpaid" | "paid";
  payment_ref: string | null;
  email: string;
  name: string;
  phone: string;
  zone: ZoneId;
  city: string;
  postal_code: string;
  address: string;
  notes: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  tracking: string | null;
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
  city: string;
  postalCode: string;
  address: string;
  notes?: string;
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

  const subtotal = lines.reduce(
    (sum, line) => sum + (catalog.get(line.slug)?.price ?? 0) * line.quantity,
    0,
  );
  const shipping = zones[input.zone].fee;
  const total = subtotal + shipping;
  const token = randomBytes(18).toString("base64url");
  const expiresAt = new Date(Date.now() + policy.reservationMinutes * 60_000);

  return transaction(async (q) => {
    await releaseExpired(q);
    await reserve(q, lines);

    const seq = await q.query<{ n: number }>(`select nextval('order_seq')::int as n`);
    const number = `TRX-${new Date().getFullYear()}-${String(seq[0].n).padStart(5, "0")}`;

    const inserted = await q.query<{ id: number }>(
      `insert into orders
         (number, token, status, email, name, phone, zone, city, postal_code,
          address, notes, subtotal, shipping, total, expires_at)
       values ($1,$2,'pending_payment',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       returning id`,
      [
        number,
        token,
        input.email.toLowerCase(),
        input.name,
        input.phone,
        input.zone,
        input.city,
        input.postalCode,
        input.address,
        input.notes ?? null,
        subtotal,
        shipping,
        total,
        expiresAt,
      ],
    );
    const id = inserted[0].id;

    for (const line of lines) {
      const product = catalog.get(line.slug)!;
      await q.query(
        `insert into order_items (order_id, slug, name, size, quantity, unit_price)
         values ($1,$2,$3,$4,$5,$6)`,
        [id, line.slug, product.name, line.size, line.quantity, product.price],
      );
    }

    return { id, number, token, total };
  });
}

async function hydrate(rows: OrderRow[]): Promise<Order[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => Number(row.id)).join(",");
  const items = await query<OrderItem & { order_id: number }>(
    `select order_id, slug, name, size, quantity, unit_price
       from order_items where order_id in (${ids}) order by id`,
  );
  return rows.map((row) => ({
    ...row,
    items: items.filter((item) => item.order_id === row.id),
  }));
}

export async function getOrderByToken(token: string) {
  const rows = await query<OrderRow>(`select * from orders where token = $1`, [token]);
  return (await hydrate(rows))[0] ?? null;
}

export async function getOrderById(id: number) {
  const rows = await query<OrderRow>(`select * from orders where id = $1`, [id]);
  return (await hydrate(rows))[0] ?? null;
}

export async function getOrderByNumber(number: string) {
  const rows = await query<OrderRow>(`select * from orders where number = $1`, [number]);
  return (await hydrate(rows))[0] ?? null;
}

export async function setPaymentRef(id: number, ref: string) {
  await query(`update orders set payment_ref = $2 where id = $1`, [id, ref]);
}

export async function listOrders(limit = 60, status?: OrderStatus) {
  const rows = status
    ? await query<OrderRow>(
        `select * from orders where status = $2 order by created_at desc limit $1`,
        [limit, status],
      )
    : await query<OrderRow>(`select * from orders order by created_at desc limit $1`, [limit]);
  return hydrate(rows);
}

const SOLD_PLAIN = `payment_status = 'paid' and status in ('confirmed', 'shipped', 'delivered')`;
const SOLD = `o.payment_status = 'paid' and o.status in ('confirmed', 'shipped', 'delivered')`;

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
  const [totals, byProduct] = await Promise.all([
    query<{
      paid_orders: number;
      revenue: number;
      revenue_7d: number;
      revenue_30d: number;
      to_ship: number;
      refund_needed: number;
      pending: number;
      refunded_count: number;
      refunded_total: number;
    }>(
      `select
         count(*) filter (where ${SOLD_PLAIN})::int as paid_orders,
         coalesce(sum(total) filter (where ${SOLD_PLAIN}), 0)::int as revenue,
         coalesce(sum(total) filter (where ${SOLD_PLAIN} and created_at > now() - interval '7 days'), 0)::int as revenue_7d,
         coalesce(sum(total) filter (where ${SOLD_PLAIN} and created_at > now() - interval '30 days'), 0)::int as revenue_30d,
         count(*) filter (where status = 'confirmed')::int as to_ship,
         count(*) filter (where status = 'refund_needed')::int as refund_needed,
         count(*) filter (where status = 'pending_payment')::int as pending,
         count(*) filter (where status = 'refunded')::int as refunded_count,
         coalesce(sum(total) filter (where status = 'refunded'), 0)::int as refunded_total
       from orders`,
    ),
    query<{ slug: string; name: string; qty: number; revenue: number }>(
      `select oi.slug, oi.name, sum(oi.quantity)::int as qty,
              sum(oi.quantity * oi.unit_price)::int as revenue
         from order_items oi join orders o on o.id = oi.order_id
        where ${SOLD}
        group by oi.slug, oi.name
        order by qty desc`,
    ),
  ]);
  const t = totals[0];
  return {
    paidOrders: t.paid_orders,
    revenue: t.revenue,
    revenue7d: t.revenue_7d,
    revenue30d: t.revenue_30d,
    toShip: t.to_ship,
    refundNeeded: t.refund_needed,
    pending: t.pending,
    refundedCount: t.refunded_count,
    refundedTotal: t.refunded_total,
    byProduct,
  };
}

/**
 * Marque une commande comme remboursée (le remboursement Stripe est déjà fait).
 * Remet les pièces en stock si demandé (retour physique) et retourne les lignes remises.
 */
export async function markRefunded(id: number, refundRef: string, restockItems: boolean) {
  return transaction(async (q): Promise<StockLine[]> => {
    const order = await lockedOrder(q, id);
    if (!order || order.status === "refunded") return [];

    const lines = await q.query<StockLine>(
      `select slug, size, quantity from order_items where order_id = $1`,
      [id],
    );
    const physical = ["confirmed", "shipped", "delivered"].includes(order.status);
    const restocked = restockItems && physical;
    if (restocked) await restock(q, lines);

    await q.query(
      `update orders set status = 'refunded', refund_ref = $2, refunded_at = now(),
              updated_at = now() where id = $1`,
      [id, refundRef],
    );
    return restocked ? lines : [];
  });
}

export type PayResult = "paid" | "already" | "refund_needed" | "mismatch" | "not_found";

/**
 * Enregistre un paiement en ligne confirmé. Idempotent : peut être appelé
 * plusieurs fois (retour client, webhook) pour la même commande.
 */
export async function markPaid(number: string, paidAmount?: number) {
  return transaction(async (q): Promise<{ result: PayResult; orderId?: number }> => {
    const rows = await q.query<OrderRow>(
      `select * from orders where number = $1 for update`,
      [number],
    );
    const order = rows[0];
    if (!order) return { result: "not_found" };
    if (order.payment_status === "paid") return { result: "already", orderId: order.id };
    if (paidAmount !== undefined && paidAmount !== order.total) {
      return { result: "mismatch", orderId: order.id };
    }

    const lines = await q.query<StockLine>(
      `select slug, size, quantity from order_items where order_id = $1`,
      [order.id],
    );

    if (order.status === "pending_payment") {
      await commitReserved(q, lines);
    } else if (order.status === "expired") {
      // Paiement tardif : on tente de reprendre le stock, sinon remboursement.
      try {
        await commitDirect(q, lines);
      } catch (error) {
        if (!(error instanceof SoldOutError)) throw error;
        await q.query(
          `update orders set status = 'refund_needed', payment_status = 'paid', updated_at = now() where id = $1`,
          [order.id],
        );
        return { result: "refund_needed", orderId: order.id };
      }
    } else {
      await q.query(
        `update orders set status = 'refund_needed', payment_status = 'paid', updated_at = now() where id = $1`,
        [order.id],
      );
      return { result: "refund_needed", orderId: order.id };
    }

    await q.query(
      `update orders set status = 'confirmed', payment_status = 'paid',
              expires_at = null, updated_at = now() where id = $1`,
      [order.id],
    );
    return { result: "paid", orderId: order.id };
  });
}

async function lockedOrder(q: Queryable, id: number) {
  const rows = await q.query<OrderRow>(`select * from orders where id = $1 for update`, [id]);
  return rows[0] ?? null;
}

/** Annule une commande et remet les pièces en stock. Retourne les lignes concernées. */
export async function cancelOrder(id: number): Promise<StockLine[]> {
  return transaction(async (q) => {
    const order = await lockedOrder(q, id);
    if (!order) return [];
    const releasable = ["pending_payment", "confirmed", "shipped", "refund_needed"];
    if (!releasable.includes(order.status)) return [];

    const lines = await q.query<StockLine>(
      `select slug, size, quantity from order_items where order_id = $1`,
      [id],
    );
    if (order.status === "pending_payment") await releaseReserved(q, lines);
    else await restock(q, lines);

    await q.query(
      `update orders set status = 'cancelled', updated_at = now() where id = $1`,
      [id],
    );
    return lines;
  });
}

export async function setShipped(id: number, tracking: string | null) {
  await query(
    `update orders set status = 'shipped', tracking = $2, updated_at = now()
      where id = $1 and status in ('confirmed', 'shipped')`,
    [id, tracking],
  );
}

export async function setDelivered(id: number) {
  await query(
    `update orders set status = 'delivered', updated_at = now()
      where id = $1 and status in ('confirmed', 'shipped')`,
    [id],
  );
}

export async function setStock(slug: string, size: string, stock: number) {
  await query(
    `update inventory set stock = greatest($3, reserved) where slug = $1 and size = $2`,
    [slug, size, stock],
  );
}

export async function inventoryRows() {
  return query<{ slug: string; size: string; stock: number; reserved: number }>(
    `select slug, size, stock, reserved from inventory`,
  );
}
