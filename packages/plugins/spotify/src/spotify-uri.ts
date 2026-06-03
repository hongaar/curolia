import type { SpotifyPinItemKind } from "./spotify-pin-data";

export type ParsedSpotifyUri = {
  kind: SpotifyPinItemKind;
  id: string;
};

/**
 * Extracts a Spotify track or playlist id from open.spotify.com URLs and spotify: URIs.
 */
export function parseSpotifyUri(input: string): ParsedSpotifyUri | null {
  const raw = input.trim();
  if (!raw) return null;

  const uriMatch = /^spotify:(track|playlist):([a-zA-Z0-9]+)$/i.exec(raw);
  if (uriMatch) {
    return {
      kind: uriMatch[1]!.toLowerCase() as SpotifyPinItemKind,
      id: uriMatch[2]!,
    };
  }

  let url: URL;
  try {
    url = new URL(raw.includes("://") ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./i, "").toLowerCase();
  if (host !== "open.spotify.com" && host !== "spotify.com") return null;

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const segment = parts[0]!.toLowerCase();
  if (segment !== "track" && segment !== "playlist") return null;

  const id = parts[1]!.split("?")[0]!;
  if (!/^[a-zA-Z0-9]+$/.test(id)) return null;

  return { kind: segment, id };
}
