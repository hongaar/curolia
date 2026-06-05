import type { PinWithTags } from "@/lib/pin-with-tags";

export type BlogPinListOrder = "chronological" | "alphabetical" | "created";
export type BlogPinListDirection = "asc" | "desc";

export type BlogPinListSort = {
  order: BlogPinListOrder;
  direction: BlogPinListDirection;
};

const STORAGE_KEY = "map:blogPinListOrder";

const DEFAULT_DIRECTION: Record<BlogPinListOrder, BlogPinListDirection> = {
  chronological: "asc",
  alphabetical: "asc",
  created: "desc",
};

type StoredPayloadV2 = {
  v: 2;
  byMap: Record<string, BlogPinListSort>;
};

function isBlogPinListOrder(v: unknown): v is BlogPinListOrder {
  return v === "chronological" || v === "alphabetical" || v === "created";
}

function isBlogPinListDirection(v: unknown): v is BlogPinListDirection {
  return v === "asc" || v === "desc";
}

export function defaultBlogPinListDirection(
  order: BlogPinListOrder,
): BlogPinListDirection {
  return DEFAULT_DIRECTION[order];
}

export function blogPinListOrderLabel(order: BlogPinListOrder): string {
  switch (order) {
    case "chronological":
      return "chronological";
    case "alphabetical":
      return "alphabetical";
    case "created":
      return "added";
  }
}

export function blogPinListOrderAriaLabel(order: BlogPinListOrder): string {
  return `Pin list order: ${blogPinListOrderLabel(order)} — change sorting`;
}

export function blogPinListDirectionLabel(
  order: BlogPinListOrder,
  direction: BlogPinListDirection,
): string {
  if (order === "alphabetical") {
    return direction === "asc" ? "A–Z" : "Z–A";
  }
  return direction === "desc" ? "newest first" : "oldest first";
}

export function blogPinListDirectionAriaLabel(
  order: BlogPinListOrder,
  direction: BlogPinListDirection,
): string {
  return `Sort direction: ${blogPinListDirectionLabel(order, direction)} — change direction`;
}

export function blogPinListDirectionOptions(order: BlogPinListOrder): {
  value: BlogPinListDirection;
  label: string;
}[] {
  if (order === "alphabetical") {
    return [
      { value: "asc", label: "A–Z" },
      { value: "desc", label: "Z–A" },
    ];
  }
  return [
    { value: "desc", label: "Newest first" },
    { value: "asc", label: "Oldest first" },
  ];
}

function parsePayload(raw: string | null): StoredPayloadV2["byMap"] {
  if (!raw) return {};
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") return {};
    const o = data as Record<string, unknown>;

    if (o.v === 2 && o.byMap && typeof o.byMap === "object") {
      const entries = Object.entries(
        o.byMap as Record<string, unknown>,
      ).flatMap(([key, sort]) => {
        if (typeof key !== "string" || key.length === 0) return [];
        if (!sort || typeof sort !== "object") return [];
        const { order, direction } = sort as Partial<BlogPinListSort>;
        if (!isBlogPinListOrder(order) || !isBlogPinListDirection(direction)) {
          return [];
        }
        return [[key, { order, direction }] as const];
      });
      return Object.fromEntries(entries);
    }

    if (o.v === 1 && o.byMap && typeof o.byMap === "object") {
      const entries = Object.entries(
        o.byMap as Record<string, unknown>,
      ).flatMap(([key, order]) => {
        if (typeof key !== "string" || key.length === 0) return [];
        if (!isBlogPinListOrder(order)) return [];
        return [
          [
            key,
            { order, direction: defaultBlogPinListDirection(order) },
          ] as const,
        ];
      });
      return Object.fromEntries(entries);
    }

    return {};
  } catch {
    return {};
  }
}

const DEFAULT_SORT: BlogPinListSort = {
  order: "chronological",
  direction: "asc",
};

/** Default when nothing is stored for this map. */
export function readBlogPinListSort(mapId: string | null): BlogPinListSort {
  if (!mapId) return DEFAULT_SORT;
  if (typeof localStorage === "undefined") return DEFAULT_SORT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const byMap = parsePayload(raw);
    return byMap[mapId] ?? DEFAULT_SORT;
  } catch {
    return DEFAULT_SORT;
  }
}

/** @deprecated Use readBlogPinListSort */
export function readBlogPinListOrder(mapId: string | null): BlogPinListOrder {
  return readBlogPinListSort(mapId).order;
}

export function writeBlogPinListSort(
  mapId: string | null,
  sort: BlogPinListSort,
): void {
  if (!mapId) return;
  if (typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const byMap = { ...parsePayload(raw), [mapId]: sort };
    const payload: StoredPayloadV2 = { v: 2, byMap };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

/** @deprecated Use writeBlogPinListSort */
export function writeBlogPinListOrder(
  mapId: string | null,
  order: BlogPinListOrder,
): void {
  writeBlogPinListSort(mapId, {
    order,
    direction: defaultBlogPinListDirection(order),
  });
}

function comparePinDates(
  a: PinWithTags,
  b: PinWithTags,
  direction: BlogPinListDirection,
): number {
  const sign = direction === "asc" ? 1 : -1;
  const da = a.date;
  const db = b.date;
  if (!da && !db) return a.id.localeCompare(b.id);
  if (!da) return 1;
  if (!db) return -1;
  const cmp = da.localeCompare(db);
  if (cmp !== 0) return cmp * sign;
  return a.id.localeCompare(b.id);
}

/** Pins re-sorted client-side according to order and direction. */
export function orderedBlogPinList(
  pins: PinWithTags[],
  sort: BlogPinListSort,
): PinWithTags[] {
  const { order, direction } = sort;

  if (order === "chronological") {
    if (direction === "asc") return pins;
    return [...pins].sort((a, b) => comparePinDates(a, b, direction));
  }

  if (order === "alphabetical") {
    const sign = direction === "asc" ? 1 : -1;
    return [...pins].sort((a, b) => {
      const ta = (a.title?.trim() || "Untitled pin").toLocaleLowerCase();
      const tb = (b.title?.trim() || "Untitled pin").toLocaleLowerCase();
      const cmp = ta.localeCompare(tb, undefined, { sensitivity: "base" });
      if (cmp !== 0) return cmp * sign;
      return a.id.localeCompare(b.id);
    });
  }

  const sign = direction === "asc" ? 1 : -1;
  return [...pins].sort((a, b) => {
    const cmp = a.created_at.localeCompare(b.created_at);
    if (cmp !== 0) return cmp * sign;
    return a.id.localeCompare(b.id);
  });
}
