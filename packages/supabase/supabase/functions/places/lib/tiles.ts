import type { createClient } from "jsr:@supabase/supabase-js@2";

import type { ExploreBounds } from "./constants.ts";

export type ExploreTile = {
  tileX: number;
  tileY: number;
};

export function tileDegForZoom(zoom: number): number {
  if (zoom >= 13) return 0.035;
  if (zoom >= 11) return 0.07;
  return 0.14;
}

export function tilesForBounds(
  bounds: ExploreBounds,
  tileDeg: number,
): ExploreTile[] {
  const minX = Math.floor(bounds.west / tileDeg);
  const maxX = Math.floor(bounds.east / tileDeg);
  const minY = Math.floor(bounds.south / tileDeg);
  const maxY = Math.floor(bounds.north / tileDeg);
  const tiles: ExploreTile[] = [];
  for (let tileX = minX; tileX <= maxX; tileX++) {
    for (let tileY = minY; tileY <= maxY; tileY++) {
      tiles.push({ tileX, tileY });
    }
  }
  return tiles;
}

export function tileBounds(tile: ExploreTile, tileDeg: number): ExploreBounds {
  return {
    west: tile.tileX * tileDeg,
    south: tile.tileY * tileDeg,
    east: (tile.tileX + 1) * tileDeg,
    north: (tile.tileY + 1) * tileDeg,
  };
}

export function tileTtlMs(zoom: number): number {
  if (zoom >= 13) return 7 * 24 * 60 * 60 * 1000;
  return 14 * 24 * 60 * 60 * 1000;
}

export async function listStaleExploreTiles(
  admin: ReturnType<typeof createClient>,
  categoryId: string,
  tileDeg: number,
  tiles: readonly ExploreTile[],
  ttlMs: number,
): Promise<ExploreTile[]> {
  if (tiles.length === 0) return [];

  const minX = Math.min(...tiles.map((t) => t.tileX));
  const maxX = Math.max(...tiles.map((t) => t.tileX));
  const minY = Math.min(...tiles.map((t) => t.tileY));
  const maxY = Math.max(...tiles.map((t) => t.tileY));

  const { data, error } = await admin
    .from("place_explore_tiles")
    .select("tile_x, tile_y, fetched_at")
    .eq("category_id", categoryId)
    .eq("tile_deg", tileDeg)
    .gte("tile_x", minX)
    .lte("tile_x", maxX)
    .gte("tile_y", minY)
    .lte("tile_y", maxY);

  if (error) throw error;

  const freshByKey = new Map<string, number>();
  for (const row of data ?? []) {
    freshByKey.set(
      `${row.tile_x},${row.tile_y}`,
      new Date(row.fetched_at as string).getTime(),
    );
  }

  const cutoff = Date.now() - ttlMs;
  return tiles.filter((tile) => {
    const fetchedAt = freshByKey.get(`${tile.tileX},${tile.tileY}`);
    return fetchedAt == null || fetchedAt < cutoff;
  });
}

export async function touchExploreTile(
  admin: ReturnType<typeof createClient>,
  categoryId: string,
  tileDeg: number,
  tile: ExploreTile,
): Promise<void> {
  const { error } = await admin.rpc("touch_place_explore_tile", {
    p_category_id: categoryId,
    p_tile_deg: tileDeg,
    p_tile_x: tile.tileX,
    p_tile_y: tile.tileY,
  });
  if (error) throw error;
}
