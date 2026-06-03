import type { SpotifyPinItemKind } from "./spotify-pin-data";

/** Spotify embed player (`theme=0` = dark). */
export function spotifyEmbedSrc(
  kind: SpotifyPinItemKind,
  spotifyId: string,
): string {
  const u = new URL(`https://open.spotify.com/embed/${kind}/${spotifyId}`);
  u.searchParams.set("utm_source", "generator");
  u.searchParams.set("theme", "0");
  return u.toString();
}

export function spotifyEmbedHeight(kind: SpotifyPinItemKind): number {
  return kind === "playlist" ? 352 : 152;
}
