import type { ExploreBounds } from "./constants.ts";
import type { ExploreTile } from "./tiles.ts";

export type ExploreContinuation = {
  v: 1;
  bounds: ExploreBounds;
  categoryId: string;
  zoom: number;
  mapCenter: { lng: number; lat: number } | null;
  hiddenGems: boolean;
  tileDeg: number;
  /** Place ids already delivered to the client (never repeat on later pages). */
  excludedPlaceIds: string[];
  pendingTiles: ExploreTile[];
  page: number;
};

export function encodeContinuation(data: ExploreContinuation): string {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function decodeContinuation(token: string): ExploreContinuation | null {
  try {
    const binary = atob(token);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const parsed = JSON.parse(
      new TextDecoder().decode(bytes),
    ) as ExploreContinuation;
    if (parsed.v !== 1) return null;
    if (!parsed.categoryId || !Array.isArray(parsed.pendingTiles)) return null;
    if (!Array.isArray(parsed.excludedPlaceIds)) return null;
    return parsed;
  } catch {
    return null;
  }
}
