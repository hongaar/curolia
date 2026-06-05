import { supabase } from "@/lib/supabase";

export type LinkMetadataLocation = {
  lat: number;
  lng: number;
  label: string | null;
  source: string;
};

export type LinkMetadata = {
  /** Original URL passed in (after light normalization, e.g. prefixing https://). */
  url: string;
  /** Final URL after redirects. */
  finalUrl: string;
  /** Hostname without leading "www." */
  domain: string;
  /** Page title fetched from the URL, or `null` when none was found. */
  title: string | null;
  /** og:description / meta description when available. */
  description: string | null;
  /** Best-effort favicon URL discovered for the page, or `null`. */
  faviconUrl: string | null;
  /** og:image / twitter:image when available. */
  imageUrl: string | null;
  /** Coordinates from URL patterns or page metadata, when found. */
  location: LinkMetadataLocation | null;
};

export function normalizeUrlInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let candidate = trimmed;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  try {
    const u = new URL(candidate);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function linkDisplayDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return url;
  }
}

const GENERIC_LINK_TITLES = [
  /^google maps$/i,
  /^maps\s*[-–—]?\s*google$/i,
  /^apple maps$/i,
  /^maps$/i,
];

function isGenericLinkTitle(title: string): boolean {
  return GENERIC_LINK_TITLES.some((pattern) => pattern.test(title));
}

function decodeUrlSegment(segment: string): string {
  try {
    return decodeURIComponent(segment.replace(/\+/g, " "));
  } catch {
    return segment.replace(/\+/g, " ");
  }
}

function looksLikeCoordinates(value: string): boolean {
  return /^-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?$/.test(value.trim());
}

/** Place or query name embedded in common map URL patterns. */
export function linkTitleFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./i, "");
    const isGoogleMaps =
      host === "maps.google.com" ||
      host === "maps.app.goo.gl" ||
      parsed.pathname.startsWith("/maps") ||
      (host.endsWith(".google.com") && parsed.pathname.startsWith("/maps"));

    if (isGoogleMaps) {
      const place = parsed.pathname.match(/\/maps\/place\/([^/@]+)/i);
      if (place?.[1]) return decodeUrlSegment(place[1]).trim() || null;

      const search = parsed.pathname.match(/\/maps\/search\/([^/@?]+)/i);
      if (search?.[1]) return decodeUrlSegment(search[1]).trim() || null;

      for (const key of ["q", "query", "place"]) {
        const value = parsed.searchParams.get(key);
        if (!value || looksLikeCoordinates(value)) continue;
        const label = decodeUrlSegment(value).trim();
        if (label) return label;
      }
    }

    if (host.includes("maps.apple.com")) {
      for (const key of ["q", "address", "name"]) {
        const value = parsed.searchParams.get(key);
        if (!value || looksLikeCoordinates(value)) continue;
        const label = decodeUrlSegment(value).trim();
        if (label) return label;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/** Best label for a stored pin link (handles generic titles like "Google Maps"). */
export function linkDisplayTitle(link: {
  title: string | null;
  url: string;
}): string {
  const stored = (link.title ?? "").trim();
  if (stored && !isGenericLinkTitle(stored)) return stored;
  const fromUrl = linkTitleFromUrl(link.url);
  if (fromUrl) return fromUrl;
  const domain = link.url ? linkDisplayDomain(link.url) : "";
  return stored || domain || link.url;
}

export async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
  const { data, error } = await supabase.functions.invoke<{
    url?: string;
    finalUrl?: string;
    domain?: string;
    title?: string | null;
    description?: string | null;
    faviconUrl?: string | null;
    imageUrl?: string | null;
    location?: LinkMetadataLocation | null;
    error?: string;
  }>("link-metadata", {
    body: { url },
  });
  if (error) throw error;
  if (!data || data.error || !data.url) {
    throw new Error(data?.error ?? "link_metadata_failed");
  }
  return {
    url: data.url,
    finalUrl: data.finalUrl ?? data.url,
    domain: data.domain ?? linkDisplayDomain(data.finalUrl ?? data.url),
    title: data.title ?? null,
    description: data.description ?? null,
    faviconUrl: data.faviconUrl ?? null,
    imageUrl: data.imageUrl ?? null,
    location: data.location ?? null,
  };
}
