import "server-only";
import { brand } from "@/lib/brand";
import { carrierLabel } from "@/lib/carriers";
import { countryName, zones } from "@/lib/shipping";
import { getBilling } from "./company";
import type { Order } from "./orders";
import { renderPackingSlip, renderReturnSlip, type BuyerSnapshot, type SellerSnapshot } from "./pdf";

async function seller(): Promise<SellerSnapshot> {
  const { company } = await getBilling();
  return { ...company, brandName: brand.name, email: brand.email };
}

const party = (order: Order): BuyerSnapshot => ({
  name: order.name,
  address: order.address,
  postalCode: order.postal_code,
  city: order.city,
  country: countryName(order.country),
  email: order.email,
});

const items = (order: Order) =>
  order.items.map((item) => ({ name: item.name, size: item.size, quantity: item.quantity }));

/** Bon de préparation (admin) : à glisser ou à imprimer au moment de préparer le colis. */
export async function packingSlipPdf(order: Order) {
  return renderPackingSlip({
    orderNumber: order.number,
    orderedAt: order.created_at,
    seller: await seller(),
    shipTo: { ...party(order), phone: order.phone },
    zoneLabel: zones[order.zone].label,
    carrier: carrierLabel(order.carrier),
    tracking: order.tracking,
    notes: order.notes,
    items: items(order),
  });
}

/** Bordereau de retour et formulaire de rétractation (client). */
export async function returnSlipPdf(order: Order) {
  return renderReturnSlip({
    orderNumber: order.number,
    orderedAt: order.created_at,
    seller: await seller(),
    customer: party(order),
    items: items(order),
  });
}
