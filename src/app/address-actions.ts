"use server";

import { clientKey, isLimited, recordEvent } from "@/server/rate-limit";

export type AddressSuggestion = {
  label: string;
  address: string;
  postalCode: string;
  city: string;
};

type BanFeature = {
  properties?: { label?: unknown; name?: unknown; postcode?: unknown; city?: unknown };
};

const text = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");

/**
 * Suggestions d'adresses en France (Base Adresse Nationale, API publique de l'État).
 * L'appel passe par le serveur : l'adresse IP du client n'est pas transmise au service,
 * et seule la saisie en cours est envoyée.
 */
export async function suggestAddresses(raw: string): Promise<AddressSuggestion[]> {
  const query = String(raw ?? "").trim().slice(0, 120);
  if (query.length < 4) return [];

  try {
    const key = await clientKey();
    if (await isLimited("address-suggest", key, 80, 600)) return [];
    await recordEvent("address-suggest", key);

    const url = new URL("https://api-adresse.data.gouv.fr/search/");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "5");
    url.searchParams.set("autocomplete", "1");

    const response = await fetch(url, { signal: AbortSignal.timeout(3000), cache: "no-store" });
    if (!response.ok) return [];
    const data = (await response.json()) as { features?: BanFeature[] };

    return (data.features ?? []).flatMap((feature) => {
      const p = feature.properties;
      const address = text(p?.name, 200);
      const postalCode = text(p?.postcode, 10);
      const city = text(p?.city, 100);
      if (!address || !/^\d{5}$/.test(postalCode) || !city) return [];
      return [{ label: text(p?.label, 250) || `${address}, ${postalCode} ${city}`, address, postalCode, city }];
    });
  } catch {
    // Service indisponible : la saisie manuelle reste possible.
    return [];
  }
}
