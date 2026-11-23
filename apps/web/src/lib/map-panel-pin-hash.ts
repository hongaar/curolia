import { PIN_ID_PARAM_RE, TAG_FILTER_SLUG_RE } from "@/lib/map-view-params";

/** `#<pin-slug>` (UUID fallback) so blog/gallery pins can be linked like anchors. */
export function mapPanelPinHash(token: string): string {
  return `#${encodeURIComponent(token.trim())}`;
}

export function parseMapPanelPinHash(hash: string): string | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw.trim()) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  const token = decoded.trim();
  if (!token) return null;
  if (PIN_ID_PARAM_RE.test(token)) return token;
  const slug = token.toLowerCase();
  if (TAG_FILTER_SLUG_RE.test(slug)) return slug;
  return null;
}

export function withUrlHash(href: string, hash: string = ""): string {
  const token = parseMapPanelPinHash(hash);
  if (!token) return href;
  return `${href}${mapPanelPinHash(token)}`;
}
