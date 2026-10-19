/** Heure de la boutique : toutes les dates affichées ou saisies sont à l'heure de Paris. */
const TZ = "Europe/Paris";

type Parts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function partsOf(ms: number): Parts {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(ms));
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** Décalage de Paris par rapport à UTC (en ms) à l'instant donné. */
function offsetAt(ms: number) {
  const p = partsOf(ms);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000;
}

const two = (n: number) => String(n).padStart(2, "0");

/** ISO (UTC) -> valeur d'un champ `datetime-local`, à l'heure de Paris. */
export function isoToParisLocal(iso: string) {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  const p = partsOf(ms);
  return `${p.year}-${two(p.month)}-${two(p.day)}T${two(p.hour)}:${two(p.minute)}`;
}

/**
 * Valeur d'un champ `datetime-local` saisie à l'heure de Paris -> ISO (UTC).
 * Renvoie null si la valeur est invalide ou n'existe pas (heure sautée au passage à l'heure d'été).
 */
export function parisLocalToIso(local: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null;
  const [y, mo, d, h, mi] = local.split(/[-T:]/).map(Number);
  const wall = Date.UTC(y, mo - 1, d, h, mi);
  let utc = wall - offsetAt(wall);
  utc = wall - offsetAt(utc);
  const iso = new Date(utc).toISOString();
  return isoToParisLocal(iso) === local ? iso : null;
}

/** Jour (AAAA-MM-JJ) à Paris. */
export function parisDayKey(date: Date | number) {
  const p = partsOf(typeof date === "number" ? date : date.getTime());
  return `${p.year}-${two(p.month)}-${two(p.day)}`;
}

/** « samedi 24 octobre · 18 h 00 » */
export function formatOpening(iso: string) {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat("fr-FR", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  const p = partsOf(date.getTime());
  return `${day} · ${p.hour} h ${two(p.minute)}`;
}
