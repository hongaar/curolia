import { isValidLatLng, parseLatLngPair, pickBestLocation } from "./coords.ts";
import type { ExtractedLocation, ParsedPageHead } from "./types.ts";

const MAX_HEAD_BYTES = 512_000;

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCodePoint(parseInt(h, 16)),
    );
}

function attr(tag: string, name: string): string | null {
  const re = new RegExp(
    `\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s/>]+))`,
    "i",
  );
  const m = tag.match(re);
  if (!m) return null;
  return decodeHtmlEntities(m[2] ?? m[3] ?? m[4] ?? "").trim();
}

function metaContentByProperty(head: string, prop: string): string | null {
  const re = new RegExp(
    `<meta\\b[^>]*\\b(?:property|name)\\s*=\\s*["']${prop}["'][^>]*>`,
    "i",
  );
  const tag = head.match(re)?.[0];
  if (!tag) return null;
  const c = attr(tag, "content");
  return c || null;
}

function resolveHref(href: string | null, baseUrl: URL): string | null {
  if (!href) return null;
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function locationFromMeta(head: string): ExtractedLocation | null {
  const candidates: (ExtractedLocation | null)[] = [];

  const geoPos = metaContentByProperty(head, "geo.position");
  if (geoPos) {
    const pair = parseLatLngPair(geoPos.replace(/;/g, ","));
    if (pair) {
      candidates.push({
        ...pair,
        source: "meta:geo.position",
        label: null,
      });
    }
  }

  const icbm = metaContentByProperty(head, "ICBM");
  if (icbm) {
    const pair = parseLatLngPair(icbm);
    if (pair) {
      candidates.push({ ...pair, source: "meta:ICBM", label: null });
    }
  }

  const ogLat = metaContentByProperty(head, "og:latitude");
  const ogLng = metaContentByProperty(head, "og:longitude");
  if (ogLat && ogLng) {
    const lat = Number(ogLat);
    const lng = Number(ogLng);
    if (isValidLatLng(lat, lng)) {
      candidates.push({
        lat,
        lng,
        source: "meta:og-geo",
        label: metaContentByProperty(head, "og:title"),
      });
    }
  }

  const placeLat = metaContentByProperty(head, "place:location:latitude");
  const placeLng = metaContentByProperty(head, "place:location:longitude");
  if (placeLat && placeLng) {
    const lat = Number(placeLat);
    const lng = Number(placeLng);
    if (isValidLatLng(lat, lng)) {
      candidates.push({
        lat,
        lng,
        source: "meta:place-location",
        label: metaContentByProperty(head, "og:title"),
      });
    }
  }

  return pickBestLocation(candidates);
}

function locationFromJsonLd(html: string): ExtractedLocation | null {
  const scripts = html.matchAll(
    /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const m of scripts) {
    const raw = m[1]?.trim();
    if (!raw) continue;
    try {
      const data = JSON.parse(raw) as unknown;
      const found = walkJsonLdForGeo(data);
      if (found) return found;
    } catch {
      /* ignore invalid JSON-LD */
    }
  }
  return null;
}

function walkJsonLdForGeo(node: unknown): ExtractedLocation | null {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = walkJsonLdForGeo(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== "object") return null;
  const obj = node as Record<string, unknown>;
  const type = String(obj["@type"] ?? obj.type ?? "");
  const geo = obj.geo ?? obj.location ?? (type.includes("Place") ? obj : null);
  if (geo && typeof geo === "object") {
    const g = geo as Record<string, unknown>;
    const lat = Number(g.latitude ?? g.lat);
    const lng = Number(g.longitude ?? g.lng ?? g.lon);
    if (isValidLatLng(lat, lng)) {
      const name =
        typeof obj.name === "string"
          ? obj.name
          : typeof g.name === "string"
            ? g.name
            : null;
      return { lat, lng, source: "json-ld:GeoCoordinates", label: name };
    }
  }
  const lat = Number(obj.latitude);
  const lng = Number(obj.longitude ?? obj.lng);
  if (isValidLatLng(lat, lng)) {
    const name = typeof obj.name === "string" ? obj.name : null;
    return { lat, lng, source: "json-ld:coordinates", label: name };
  }
  for (const value of Object.values(obj)) {
    const found = walkJsonLdForGeo(value);
    if (found) return found;
  }
  return null;
}

/** Parse `<head>` (and JSON-LD in full HTML) for page + location metadata. */
export function parsePageMetadata(html: string, baseUrl: URL): ParsedPageHead {
  const head = (html.match(/<head[\s\S]*?<\/head>/i)?.[0] ?? html).slice(
    0,
    MAX_HEAD_BYTES,
  );

  let title: string | null = null;
  const ogTitle = metaContentByProperty(head, "og:title");
  const twitterTitle = metaContentByProperty(head, "twitter:title");
  title = ogTitle ?? twitterTitle ?? null;
  if (!title) {
    const t = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (t?.[1]) title = decodeHtmlEntities(t[1]).replace(/\s+/g, " ").trim();
  }
  if (title && title.length > 200) title = title.slice(0, 200);

  let description: string | null =
    metaContentByProperty(head, "og:description") ??
    metaContentByProperty(head, "twitter:description") ??
    metaContentByProperty(head, "description");
  if (description && description.length > 2000) {
    description = description.slice(0, 2000);
  }

  let iconHref: string | null = null;
  const linkRe = /<link\b[^>]*>/gi;
  const candidates: { rel: string; href: string; sizes: number }[] = [];
  for (const m of head.matchAll(linkRe)) {
    const tag = m[0];
    const rel = (attr(tag, "rel") ?? "").toLowerCase();
    if (
      !rel.includes("icon") &&
      rel !== "shortcut icon" &&
      rel !== "apple-touch-icon"
    ) {
      continue;
    }
    const href = attr(tag, "href");
    if (!href) continue;
    const sizesAttr = attr(tag, "sizes") ?? "";
    const sizeMatch = sizesAttr.match(/(\d+)/);
    candidates.push({
      rel,
      href,
      sizes: sizeMatch ? Number(sizeMatch[1]) : 0,
    });
  }
  if (candidates.length > 0) {
    candidates.sort((a, b) => {
      const aPref = a.rel === "apple-touch-icon" ? 1 : 0;
      const bPref = b.rel === "apple-touch-icon" ? 1 : 0;
      if (aPref !== bPref) return bPref - aPref;
      return b.sizes - a.sizes;
    });
    iconHref = candidates[0]!.href;
  }

  const imageHref =
    metaContentByProperty(head, "og:image") ??
    metaContentByProperty(head, "twitter:image");

  const location =
    pickBestLocation([locationFromMeta(head), locationFromJsonLd(html)]) ??
    null;

  return {
    title,
    description,
    iconHref: resolveHref(iconHref, baseUrl),
    imageHref: resolveHref(imageHref, baseUrl),
    location,
  };
}
