import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Signed URLs for the private `pin-photos` bucket, reused across renders and
 * page loads.
 *
 * Every `createSignedUrls` call mints a new token, and both the browser HTTP
 * cache and the Supabase CDN key on the full URL — so re-signing on each load
 * re-downloads every photo. Instead we keep one URL per storage path (in memory
 * and `localStorage`) and only re-sign when it is close to expiring. Storage
 * answers signed requests with `Expires` set to the token expiry, so the token
 * lifetime is also the browser cache lifetime.
 */

const BUCKET = "pin-photos";
const STORAGE_KEY = "curolia:pin-photo-urls:v1";

/** Token lifetime requested from Storage. */
export const PIN_PHOTO_URL_TTL_SECONDS = 7 * 24 * 60 * 60;
/** Re-sign when less than this remains, so a URL never expires mid-session. */
const REFRESH_MARGIN_MS = 24 * 60 * 60 * 1000;

type Entry = { url: string; expiresAt: number };

let memory: Map<string, Entry> | null = null;
const inflight = new Map<string, Promise<string | null>>();

function storage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

function load(now: number): Map<string, Entry> {
  if (memory) return memory;
  memory = new Map();
  try {
    const raw = storage()?.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, Entry>) : {};
    for (const [path, entry] of Object.entries(parsed)) {
      if (
        typeof entry?.url === "string" &&
        typeof entry.expiresAt === "number" &&
        entry.expiresAt > now
      ) {
        memory.set(path, entry);
      }
    }
  } catch {
    // Corrupt or unavailable storage: start empty.
  }
  return memory;
}

function persist(cache: Map<string, Entry>, now: number) {
  const out: Record<string, Entry> = {};
  for (const [path, entry] of cache) {
    if (entry.expiresAt > now) out[path] = entry;
  }
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(out));
  } catch {
    // Quota exceeded or storage disabled: the in-memory cache still works.
  }
}

function freshUrl(cache: Map<string, Entry>, path: string, now: number) {
  const entry = cache.get(path);
  return entry && entry.expiresAt - now > REFRESH_MARGIN_MS ? entry.url : null;
}

/**
 * Signed URLs for `pin-photos` storage paths, keyed by path. Reuses cached URLs
 * that are not near expiry, signs the rest in one request, and shares
 * in-flight requests so concurrent callers get the same URL.
 */
export async function signPinPhotoPaths(
  client: SupabaseClient,
  paths: string[],
): Promise<Record<string, string>> {
  const now = Date.now();
  const cache = load(now);
  const out: Record<string, string> = {};
  const waiting: Promise<void>[] = [];
  const toSign: string[] = [];

  for (const path of new Set(paths)) {
    const cached = freshUrl(cache, path, now);
    if (cached) {
      out[path] = cached;
      continue;
    }
    const pending = inflight.get(path);
    if (pending) {
      waiting.push(
        pending.then((url) => {
          if (url) out[path] = url;
        }),
      );
      continue;
    }
    toSign.push(path);
  }

  if (toSign.length > 0) {
    const batch = client.storage
      .from(BUCKET)
      .createSignedUrls(toSign, PIN_PHOTO_URL_TTL_SECONDS)
      .then(({ data, error }) => {
        const urls = new Map<string, string>();
        if (error) {
          console.error("pin-photos createSignedUrls", error);
          return urls;
        }
        const expiresAt = now + PIN_PHOTO_URL_TTL_SECONDS * 1000;
        toSign.forEach((path, i) => {
          const row = data?.[i];
          if (row?.signedUrl && !row.error) {
            urls.set(path, row.signedUrl);
            cache.set(path, { url: row.signedUrl, expiresAt });
          } else if (row?.error) {
            console.error(path, row.error);
          }
        });
        persist(cache, Date.now());
        return urls;
      });

    for (const path of toSign) {
      const perPath = batch.then((urls) => urls.get(path) ?? null);
      inflight.set(path, perPath);
      void perPath.finally(() => {
        if (inflight.get(path) === perPath) inflight.delete(path);
      });
    }

    const urls = await batch;
    for (const [path, url] of urls) out[path] = url;
  }

  await Promise.all(waiting);
  return out;
}

/** Forget all cached signed URLs (e.g. on sign-out). */
export function clearPinPhotoUrlCache() {
  memory = new Map();
  inflight.clear();
  try {
    storage()?.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
