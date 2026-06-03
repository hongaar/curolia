import {
  assembleLinkMetadata,
  normalizeRequestUrl,
} from "@curolia/link-metadata";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * Resolves a URL → page metadata (title, description, favicon, image, location)
 * for pin links and map link paste.
 * Authenticated; the function gateway already validates the JWT.
 */

const FETCH_TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 512_000;

const USER_AGENT =
  "Mozilla/5.0 (compatible; CuroliaLinkPreview/1.0; +https://curolia.app)";

function cors(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(), "Content-Type": "application/json" },
  });
}

async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      redirect: "follow",
      ...init,
      signal: ctrl.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        ...(init?.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(t);
  }
}

async function readBoundedText(
  res: Response,
  maxBytes: number,
): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return await res.text();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.byteLength;
      if (total >= maxBytes) {
        try {
          await reader.cancel();
        } catch {
          /* noop */
        }
        break;
      }
    }
  }
  const buf = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    buf.set(
      c.subarray(0, Math.min(c.byteLength, buf.byteLength - offset)),
      offset,
    );
    offset += c.byteLength;
    if (offset >= buf.byteLength) break;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(buf);
}

async function probeFavicon(faviconUrl: string): Promise<boolean> {
  try {
    const head = await fetchWithTimeout(faviconUrl, { method: "HEAD" });
    if (head.ok) return true;
    if (head.status === 405 || head.status === 501) {
      const get = await fetchWithTimeout(faviconUrl, { method: "GET" });
      try {
        await get.body?.cancel();
      } catch {
        /* noop */
      }
      return get.ok;
    }
    return false;
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors() });
  if (req.method !== "POST") {
    return jsonResponse(405, { error: "method_not_allowed" });
  }

  let body: { url?: unknown };
  try {
    body = (await req.json()) as { url?: unknown };
  } catch {
    return jsonResponse(400, { error: "bad_json" });
  }

  if (typeof body.url !== "string") {
    return jsonResponse(400, { error: "missing_url" });
  }

  const target = normalizeRequestUrl(body.url);
  if (!target) {
    return jsonResponse(400, { error: "invalid_url" });
  }

  let res: Response;
  try {
    res = await fetchWithTimeout(target.toString());
  } catch (e) {
    console.error("link-metadata fetch failed", e);
    return jsonResponse(502, { error: "fetch_failed" });
  }

  const finalUrl = (() => {
    try {
      return new URL(res.url || target.toString());
    } catch {
      return target;
    }
  })();

  let html: string | null = null;
  const ct = res.headers.get("content-type") ?? "";
  if (
    res.ok &&
    (ct.includes("text/html") || ct.includes("application/xhtml"))
  ) {
    try {
      html = await readBoundedText(res, MAX_HTML_BYTES);
    } catch (e) {
      console.error("link-metadata read html failed", e);
    }
  } else {
    try {
      await res.body?.cancel();
    } catch {
      /* noop */
    }
  }

  const assembled = assembleLinkMetadata({
    url: target.toString(),
    finalUrl: finalUrl.toString(),
    html,
  });

  let faviconUrl = assembled.faviconUrl;
  if (!faviconUrl) {
    const fallback = new URL("/favicon.ico", finalUrl).toString();
    if (await probeFavicon(fallback)) faviconUrl = fallback;
  }

  const location = assembled.location
    ? {
        lat: assembled.location.lat,
        lng: assembled.location.lng,
        label: assembled.location.label ?? null,
        source: assembled.location.source,
      }
    : null;

  return jsonResponse(200, {
    url: assembled.url,
    finalUrl: assembled.finalUrl,
    domain: assembled.domain,
    title: assembled.title,
    description: assembled.description,
    faviconUrl,
    imageUrl: assembled.imageUrl,
    location,
  });
});
