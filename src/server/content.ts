import "server-only";
import { cache } from "react";
import { brand } from "@/lib/brand";
import { legalPages, type LegalPage } from "@/lib/legal";
import { query } from "./db";

/**
 * Pages d'information : les textes par défaut sont dans src/lib/legal.ts ; une ligne de la
 * table `site_pages` (même slug) les remplace, et les pages créées dans l'admin s'y ajoutent.
 * Supprimer la ligne d'une page par défaut restaure le texte du code.
 */
export type SitePage = LegalPage & {
  active: boolean;
  position: number;
  /** Vrai si une ligne en base existe pour ce slug. */
  fromDb: boolean;
  /** Vrai si la page n'existe pas dans le code (créée dans l'admin). */
  custom: boolean;
};

type PageRow = {
  slug: string;
  title: string;
  intro: string;
  content: string;
  position: number;
  active: boolean;
};

/**
 * Format texte éditable : une ligne `## Titre` ouvre une section ; les paragraphes sont
 * séparés par une ligne vide.
 */
export function parseContent(text: string): LegalPage["sections"] {
  const sections: LegalPage["sections"] = [];
  let current: { heading: string; lines: string[] } | null = null;
  const flush = () => {
    if (!current) return;
    const body = current.lines
      .join("\n")
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
      .filter(Boolean);
    if (current.heading || body.length) sections.push({ heading: current.heading, body });
  };
  for (const line of text.replace(/\r/g, "").split("\n")) {
    const match = /^##\s+(.*)$/.exec(line);
    if (match) {
      flush();
      current = { heading: match[1].trim(), lines: [] };
    } else {
      current ??= { heading: "", lines: [] };
      current.lines.push(line);
    }
  }
  flush();
  return sections;
}

export function serializeContent(sections: LegalPage["sections"]): string {
  return sections
    .map((section) =>
      [...(section.heading ? [`## ${section.heading}`] : []), ...section.body].join("\n\n"),
    )
    .join("\n\n");
}

const defaultPages: SitePage[] = legalPages.map((page, index) => ({
  ...page,
  active: true,
  position: (index + 1) * 10,
  fromDb: false,
  custom: false,
}));

async function loadPages(): Promise<SitePage[]> {
  let rows: PageRow[];
  try {
    rows = await query<PageRow>("select * from site_pages");
  } catch (error) {
    console.warn("[content] base indisponible, pages par défaut utilisées :", error);
    return defaultPages;
  }
  const defaultSlugs = new Set(defaultPages.map((page) => page.slug));
  const merged = new Map(defaultPages.map((page) => [page.slug, page]));
  for (const row of rows) {
    merged.set(row.slug, {
      slug: row.slug,
      title: row.title,
      intro: row.intro || undefined,
      sections: parseContent(row.content),
      active: row.active,
      position: Number(row.position),
      fromDb: true,
      custom: !defaultSlugs.has(row.slug),
    });
  }
  return [...merged.values()].sort(
    (a, b) => a.position - b.position || a.title.localeCompare(b.title, "fr"),
  );
}

/** Toutes les pages, masquées comprises (admin). */
export const getAllPages = cache(loadPages);

export async function getPages(): Promise<SitePage[]> {
  return (await getAllPages()).filter((page) => page.active);
}

export async function getPage(slug: string): Promise<SitePage | undefined> {
  return (await getPages()).find((page) => page.slug === slug);
}

export async function savePage(page: {
  slug: string;
  title: string;
  intro: string;
  content: string;
  position: number;
  active: boolean;
}) {
  await query(
    `insert into site_pages (slug, title, intro, content, position, active)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (slug) do update set title = excluded.title, intro = excluded.intro,
       content = excluded.content, position = excluded.position, active = excluded.active,
       updated_at = now()`,
    [page.slug, page.title, page.intro, page.content, page.position, page.active],
  );
}

/** Page par défaut : restaure le texte du code. Page créée : la supprime. */
export async function deletePageRow(slug: string) {
  await query("delete from site_pages where slug = $1", [slug]);
}

export async function nextPagePosition() {
  const all = await getAllPages();
  return all.reduce((max, page) => Math.max(max, page.position), 0) + 10;
}

/* Réglages du site */

export type Settings = { tagline: string; logoUrl: string | null };

async function loadSettings(): Promise<Settings> {
  const settings: Settings = { tagline: brand.tagline, logoUrl: null };
  try {
    const rows = await query<{ key: string; value: string }>("select key, value from site_settings");
    for (const row of rows) {
      if (row.key === "tagline" && row.value.trim()) settings.tagline = row.value;
      if (row.key === "logo_url" && row.value.trim()) settings.logoUrl = row.value;
    }
  } catch (error) {
    console.warn("[content] réglages indisponibles, valeurs par défaut :", error);
  }
  return settings;
}

export const getSettings = cache(loadSettings);

export async function setSetting(key: "tagline" | "logo_url", value: string | null) {
  if (value === null || value === "") {
    await query("delete from site_settings where key = $1", [key]);
    return;
  }
  await query(
    `insert into site_settings (key, value) values ($1, $2)
     on conflict (key) do update set value = excluded.value`,
    [key, value],
  );
}
