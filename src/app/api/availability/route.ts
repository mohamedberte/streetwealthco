import { getAvailability } from "@/server/inventory";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getAvailability(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[availability]", error);
    return Response.json({ error: "indisponible" }, { status: 503 });
  }
}
