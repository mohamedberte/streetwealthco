import "server-only";
import { db, unwrap } from "./db";

/** Historique d'une commande : étapes visibles par le client et notes internes (type `note`). */
export type OrderEventType =
  | "created"
  | "paid"
  | "refund_needed"
  | "invoice"
  | "credit_note"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "note";

export type OrderEvent = {
  id: number;
  type: OrderEventType;
  detail: string | null;
  actor: "system" | "admin" | "client";
  created_at: Date;
};

/** L'historique ne doit jamais bloquer une opération : un échec est seulement journalisé. */
export async function logOrderEvent(
  orderId: number,
  type: OrderEventType,
  detail: string | null = null,
  actor: OrderEvent["actor"] = "system",
) {
  try {
    unwrap(
      await db()
        .from("order_events")
        .insert({ order_id: orderId, type, detail: detail?.slice(0, 500) ?? null, actor }),
    );
  } catch (error) {
    console.error("[events] enregistrement impossible", error);
  }
}

export async function listOrderEvents(orderId: number): Promise<OrderEvent[]> {
  try {
    const rows = unwrap<(Omit<OrderEvent, "created_at"> & { created_at: string })[]>(
      await db()
        .from("order_events")
        .select("id, type, detail, actor, created_at")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true }),
    );
    return rows.map((row) => ({ ...row, created_at: new Date(row.created_at) }));
  } catch (error) {
    console.error("[events] lecture impossible", error);
    return [];
  }
}

/** Étapes visibles par le client : liste blanche, pour qu'un futur type interne ne fuite pas par défaut. */
const PUBLIC_TYPES: OrderEventType[] = [
  "created",
  "paid",
  "invoice",
  "credit_note",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];
export const publicEvents = (events: OrderEvent[]) => events.filter((event) => PUBLIC_TYPES.includes(event.type));

export const firstEvent = (events: OrderEvent[], type: OrderEventType) =>
  events.find((event) => event.type === type);
