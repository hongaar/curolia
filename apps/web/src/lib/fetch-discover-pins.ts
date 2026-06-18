import { fetchOwnerProfileSlugs } from "@/lib/map-route";
import type { PinWithTags } from "@/lib/pin-with-tags";
import { supabase } from "@/lib/supabase";
import type { CuroliaMap } from "@/types/database";

export type DiscoverPinMeta = {
  mapId: string;
  mapName: string;
  mapSlug: string;
  mapEmoji: string | null;
  ownerProfileSlug: string;
  coverUrl: string | null;
  updatedAt: string;
  pinCount: number;
};

export type DiscoverPin = PinWithTags & {
  discoverMap: DiscoverPinMeta;
};

export async function fetchDiscoverPins(): Promise<DiscoverPin[]> {
  const { data: mapsData, error: mapsError } = await supabase
    .from("maps")
    .select(
      "id, name, slug, icon_emoji, created_by_user_id, cover_url, updated_at",
    )
    .eq("is_public", true)
    .order("updated_at", { ascending: false });
  if (mapsError) throw mapsError;

  const maps = (mapsData ?? []) as Pick<
    CuroliaMap,
    | "id"
    | "name"
    | "slug"
    | "icon_emoji"
    | "created_by_user_id"
    | "cover_url"
    | "updated_at"
  >[];
  if (maps.length === 0) return [];

  const slugByOwnerId = await fetchOwnerProfileSlugs(
    maps.map((map) => map.created_by_user_id),
  );
  const mapMetaById = new Map(
    maps.map((map) => [
      map.id,
      {
        mapId: map.id,
        mapName: map.name,
        mapSlug: map.slug,
        mapEmoji: map.icon_emoji,
        ownerProfileSlug: slugByOwnerId.get(map.created_by_user_id) ?? "",
        coverUrl: map.cover_url,
        updatedAt: map.updated_at,
        pinCount: 0,
      } satisfies DiscoverPinMeta,
    ]),
  );
  const mapIds = maps.map((map) => map.id);

  const { data: pinsData, error: pinsError } = await supabase
    .from("pins")
    .select(
      `*,
      pin_tags ( tag_id, tags ( id, name, color, icon_emoji ) ),
      photos ( id, storage_path, sort_order )`,
    )
    .in("map_id", mapIds)
    .order("date", { ascending: false, nullsFirst: false });
  if (pinsError) throw pinsError;

  const pins = (pinsData ?? []) as PinWithTags[];
  const pinCountByMapId = new Map<string, number>();
  for (const pin of pins) {
    pinCountByMapId.set(pin.map_id, (pinCountByMapId.get(pin.map_id) ?? 0) + 1);
  }
  for (const [mapId, meta] of mapMetaById) {
    mapMetaById.set(mapId, {
      ...meta,
      pinCount: pinCountByMapId.get(mapId) ?? 0,
    });
  }

  const out: DiscoverPin[] = [];
  for (const pin of pins) {
    const discoverMap = mapMetaById.get(pin.map_id);
    if (!discoverMap?.ownerProfileSlug) continue;
    out.push({ ...pin, discoverMap });
  }
  return out;
}
