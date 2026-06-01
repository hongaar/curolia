import type { PinWithTags } from "@/lib/pin-with-tags";

export type BlogPinListOrder = "chronological" | "alphabetical";

const STORAGE_KEY = "map:blogPinListOrder";

type StoredPayload = {
  v: 1;
  byMap: Record<string, BlogPinListOrder>;
};

function isBlogPinListOrder(v: unknown): v is BlogPinListOrder {
  return v === "chronological" || v === "alphabetical";
}

function parsePayload(raw: string | null): StoredPayload["byMap"] {
  if (!raw) return {};
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") return {};
    const o = data as Partial<StoredPayload>;
    if (o.v !== 1 || !o.byMap || typeof o.byMap !== "object") return {};
    const entries = Object.entries(o.byMap).filter(
      ([key, mode]) =>
        typeof key === "string" && key.length > 0 && isBlogPinListOrder(mode),
    ) as [string, BlogPinListOrder][];
    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

/** Default when nothing is stored for this map. */
export function readBlogPinListOrder(mapId: string | null): BlogPinListOrder {
  if (!mapId) return "chronological";
  if (typeof localStorage === "undefined") return "chronological";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const byMap = parsePayload(raw);
    const stored = byMap[mapId];
    return stored ?? "chronological";
  } catch {
    return "chronological";
  }
}

export function writeBlogPinListOrder(
  mapId: string | null,
  order: BlogPinListOrder,
): void {
  if (!mapId) return;
  if (typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const byMap = { ...parsePayload(raw), [mapId]: order };
    const payload: StoredPayload = { v: 1, byMap };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

/** Pins filtered from a chronological query; alphabetical re-sorts, chronological keeps Array order. */
export function orderedBlogPinList(
  pins: PinWithTags[],
  order: BlogPinListOrder,
): PinWithTags[] {
  if (order !== "alphabetical") return pins;

  return [...pins].sort((a, b) => {
    const ta = (a.title?.trim() || "Untitled pin").toLocaleLowerCase();
    const tb = (b.title?.trim() || "Untitled pin").toLocaleLowerCase();
    const cmp = ta.localeCompare(tb, undefined, { sensitivity: "base" });
    if (cmp !== 0) return cmp;
    return a.id.localeCompare(b.id);
  });
}
