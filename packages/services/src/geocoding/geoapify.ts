import type { Coords } from "../coords.ts";

const GEOAPIFY_FETCH_TIMEOUT_MS = 12_000;
const GEOAPIFY_GEOCODE_URL = "https://api.geoapify.com/v1/geocode/search";
const GEOAPIFY_BATCH_GEOCODE_URL =
  "https://api.geoapify.com/v1/batch/geocode/search";

export const GEOAPIFY_BATCH_MIN_SIZE = 15;
export const GEOAPIFY_BATCH_POLL_MS = 2_000;
export const GEOAPIFY_BATCH_MAX_ATTEMPTS = 30;
export const GEOAPIFY_SYNC_SPACING_MS = 220;

export type GeoapifyClient = {
  geocodeText: (text: string) => Promise<Coords | null>;
  geocodeTextBatch: (
    texts: readonly string[],
    options?: { pollMs?: number; maxAttempts?: number; deadlineMs?: number },
  ) => Promise<(Coords | null)[]>;
};

export function createGeoapifyClient(
  apiKey: string | undefined,
): GeoapifyClient | null {
  const key = apiKey?.trim();
  if (!key) return null;

  return {
    geocodeText: (text) => geocodeTextSingle(key, text),
    geocodeTextBatch: (texts, options) => geocodeTextBatch(key, texts, options),
  };
}

export function buildGeoapifySearchText(args: {
  title: string;
  collectionName?: string;
  note?: string | null;
}): string {
  const parts = [args.title.trim()];
  if (args.collectionName?.trim()) parts.push(args.collectionName.trim());
  if (args.note?.trim()) parts.push(args.note.trim());
  return parts.filter(Boolean).join(", ");
}

async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), GEOAPIFY_FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

function coordsFromGeoapifyFeature(feature: unknown): Coords | null {
  if (!feature || typeof feature !== "object") return null;
  const props = (feature as { properties?: { lat?: number; lon?: number } })
    .properties;
  const lat = props?.lat;
  const lng = props?.lon;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function coordsFromGeoapifyBatchRow(row: unknown): Coords | null {
  if (!row || typeof row !== "object") return null;
  const direct = row as { lat?: number; lon?: number };
  if (typeof direct.lat === "number" && typeof direct.lon === "number") {
    return { lat: direct.lat, lng: direct.lon };
  }
  return coordsFromGeoapifyFeature(row);
}

export async function geocodeTextSingle(
  apiKey: string,
  text: string,
): Promise<Coords | null> {
  const query = text.trim();
  if (!query) return null;
  const params = new URLSearchParams({
    text: query,
    apiKey,
    type: "amenity",
  });
  try {
    const res = await fetchWithTimeout(`${GEOAPIFY_GEOCODE_URL}?${params}`);
    if (!res.ok) {
      console.warn("geoapify geocode failed", query.slice(0, 80), res.status);
      return null;
    }
    const body = (await res.json()) as { features?: unknown[] };
    return coordsFromGeoapifyFeature(body.features?.[0]) ?? null;
  } catch (err) {
    console.warn("geoapify geocode error", query.slice(0, 80), err);
    return null;
  }
}

type BatchPollOptions = {
  pollMs?: number;
  maxAttempts?: number;
  deadlineMs?: number;
};

export async function geocodeTextBatch(
  apiKey: string,
  texts: readonly string[],
  options?: BatchPollOptions,
): Promise<(Coords | null)[]> {
  if (texts.length === 0) return [];
  if (texts.length === 1) {
    return [await geocodeTextSingle(apiKey, texts[0]!)];
  }

  const pollMs = options?.pollMs ?? GEOAPIFY_BATCH_POLL_MS;
  const maxAttempts = options?.maxAttempts ?? GEOAPIFY_BATCH_MAX_ATTEMPTS;
  const deadlineMs = options?.deadlineMs ?? pollMs * maxAttempts;
  const startedAt = Date.now();

  const submitUrl = `${GEOAPIFY_BATCH_GEOCODE_URL}?apiKey=${encodeURIComponent(apiKey)}&type=amenity`;
  let jobId: string;
  try {
    const res = await fetchWithTimeout(submitUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(texts),
    });
    if (res.status !== 202) {
      console.warn("geoapify batch submit failed", res.status);
      return geocodeTextSequential(
        apiKey,
        texts,
        deadlineMs - (Date.now() - startedAt),
      );
    }
    const body = (await res.json()) as { id?: string };
    if (!body.id) {
      console.warn("geoapify batch missing job id");
      return geocodeTextSequential(
        apiKey,
        texts,
        deadlineMs - (Date.now() - startedAt),
      );
    }
    jobId = body.id;
  } catch (err) {
    console.warn("geoapify batch submit error", err);
    return geocodeTextSequential(
      apiKey,
      texts,
      deadlineMs - (Date.now() - startedAt),
    );
  }

  const resultUrl = `${GEOAPIFY_BATCH_GEOCODE_URL}?id=${encodeURIComponent(jobId)}&apiKey=${encodeURIComponent(apiKey)}`;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (Date.now() - startedAt >= deadlineMs) break;
    await sleep(pollMs);
    try {
      const res = await fetchWithTimeout(resultUrl, {
        headers: { Accept: "application/json" },
      });
      if (res.status === 202) continue;
      if (res.status !== 200) {
        console.warn("geoapify batch poll failed", res.status);
        break;
      }
      const body = (await res.json()) as unknown;
      if (!Array.isArray(body)) {
        console.warn("geoapify batch unexpected body");
        break;
      }
      return body.map((row) => coordsFromGeoapifyBatchRow(row));
    } catch (err) {
      console.warn("geoapify batch poll error", err);
      break;
    }
  }

  console.warn("geoapify batch timed out; falling back to sequential");
  return geocodeTextSequential(
    apiKey,
    texts,
    Math.max(0, deadlineMs - (Date.now() - startedAt)),
  );
}

async function geocodeTextSequential(
  apiKey: string,
  texts: readonly string[],
  timeBudgetMs: number,
): Promise<(Coords | null)[]> {
  const startedAt = Date.now();
  const out: (Coords | null)[] = [];
  for (const text of texts) {
    if (Date.now() - startedAt >= timeBudgetMs) {
      out.push(null);
      continue;
    }
    out.push(await geocodeTextSingle(apiKey, text));
    await sleep(GEOAPIFY_SYNC_SPACING_MS);
  }
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
