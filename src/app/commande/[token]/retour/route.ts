import { returnSlipPdf } from "@/server/documents";
import { getOrderByToken } from "@/server/orders";
import { notFound, pdfResponse, rateLimited } from "@/server/pdf-response";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ token: string }> };

/** Bordereau de retour et formulaire de rétractation, disponibles une fois la commande expédiée. */
export async function GET(_request: Request, { params }: Context) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return notFound();
  const limited = await rateLimited("document");
  if (limited) return limited;

  const order = await getOrderByToken(token);
  if (!order || !["shipped", "delivered"].includes(order.status)) return notFound();

  return pdfResponse(await returnSlipPdf(order), `retour-${order.number}.pdf`);
}
