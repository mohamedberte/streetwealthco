import { notFound } from "next/navigation";
import { markImage } from "@/lib/og";

const SIZES = new Set([192, 512]);

/** Icônes de l'application (manifest) : /pwa/192 et /pwa/512, avec marge de sécurité « maskable ». */
export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size);
  if (!SIZES.has(size)) notFound();
  return markImage(size, 0.1);
}
