"use server";

import { euCountries, euCountryCodes } from "@/lib/shipping";
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

type PhotonFeature = {
  properties?: {
    type?: unknown;
    name?: unknown;
    street?: unknown;
    housenumber?: unknown;
    postcode?: unknown;
    city?: unknown;
    locality?: unknown;
    district?: unknown;
    countrycode?: unknown;
  };
};

const text = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");

/** Pays où le numéro précède la rue (« 12 rue … ») ; ailleurs il la suit (« Straße 12 »). */
const NUMBER_FIRST = new Set(["FR", "LU", "IE", "CY", "MT"]);

async function franceSuggestions(query: string): Promise<AddressSuggestion[]> {
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
}

async function europeSuggestions(query: string, country: string): Promise<AddressSuggestion[]> {
  const countryLabel = euCountries.find((item) => item.code === country)?.name ?? "";
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", `${query} ${countryLabel}`.trim());
  url.searchParams.set("limit", "10");
  url.searchParams.set("lang", "fr");

  const response = await fetch(url, { signal: AbortSignal.timeout(3000), cache: "no-store" });
  if (!response.ok) return [];
  const data = (await response.json()) as { features?: PhotonFeature[] };

  const seen = new Set<string>();
  const result: AddressSuggestion[] = [];
  for (const feature of data.features ?? []) {
    const p = feature.properties;
    if (text(p?.countrycode, 2).toUpperCase() !== country) continue;
    const street = text(p?.street, 150) || (p?.type === "street" ? text(p?.name, 150) : "");
    const number = text(p?.housenumber, 20);
    const postalCode = text(p?.postcode, 10);
    const city = text(p?.city, 100) || text(p?.locality, 100) || text(p?.district, 100);
    if (!street || !postalCode || !city) continue;
    const address = number ? (NUMBER_FIRST.has(country) ? `${number} ${street}` : `${street} ${number}`) : street;
    const label = `${address}, ${postalCode} ${city}`;
    if (seen.has(label)) continue;
    seen.add(label);
    result.push({ label, address, postalCode, city });
    if (result.length === 5) break;
  }
  return result;
}

/**
 * Suggestions d'adresses : Base Adresse Nationale (service public) pour la France, Photon
 * (OpenStreetMap) pour l'Union européenne. L'appel passe par le serveur : l'adresse IP du client
 * n'est pas transmise au service, et seule la saisie en cours l'est.
 */
export async function suggestAddresses(raw: string, rawCountry = "FR"): Promise<AddressSuggestion[]> {
  const query = String(raw ?? "").trim().slice(0, 120);
  const country = String(rawCountry ?? "").toUpperCase();
  if (query.length < 4) return [];
  if (country !== "FR" && !euCountryCodes.includes(country)) return [];

  try {
    const key = await clientKey();
    if (await isLimited("address-suggest", key, 80, 600)) return [];
    await recordEvent("address-suggest", key);
    return country === "FR" ? await franceSuggestions(query) : await europeSuggestions(query, country);
  } catch {
    // Service indisponible : la saisie manuelle reste possible.
    return [];
  }
}
