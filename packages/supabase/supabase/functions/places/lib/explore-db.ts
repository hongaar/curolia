import type { createClient } from "jsr:@supabase/supabase-js@2";

import {
  CLUSTER_CELL_DEG,
  CLUSTER_LIMIT,
  DATASET_LIMIT,
  EXPLORE_CATEGORY_LABELS,
  type ExploreBounds,
} from "./constants.ts";
import { haversineM } from "./overpass-bbox.ts";

export type ExploreResultEntry = {
  id: string;
  categoryId: string;
  featureKind: "place" | "cluster";
  title: string;
  subtitle?: string;
  distanceMeters?: number;
  filterValues: Record<string, unknown>;
  geometry: { kind: "point"; lng: number; lat: number };
  placeId?: string;
  count?: number;
  preview?: { categoryLabel?: string; rating?: number; thumbnailUrl?: string };
  detail?: Record<string, unknown>;
};

type PlaceRow = {
  id: string;
  name: string | null;
  lat: number | null;
  lng: number | null;
  primary_category: string | null;
  categories: string[];
  pin_count: number;
  prominence_score: number;
};

export async function loadPlaceMetadataBatch(
  admin: ReturnType<typeof createClient>,
  placeIds: readonly string[],
): Promise<Map<string, Record<string, unknown>>> {
  const out = new Map<string, Record<string, unknown>>();
  if (placeIds.length === 0) return out;

  const { data, error } = await admin
    .from("place_metadata")
    .select("place_id, field_key, value")
    .in("place_id", [...placeIds]);
  if (error) throw error;

  for (const row of data ?? []) {
    const placeId = row.place_id as string;
    if (!out.has(placeId)) out.set(placeId, {});
    out.get(placeId)![row.field_key as string] = row.value;
  }
  return out;
}

export function placeRowToEntry(
  row: PlaceRow,
  categoryId: string,
  mapCenter: { lng: number; lat: number } | null,
  metadata: Record<string, unknown>,
): ExploreResultEntry {
  const lat = row.lat ?? 0;
  const lng = row.lng ?? 0;
  const distanceMeters = mapCenter
    ? Math.round(haversineM(mapCenter.lat, mapCenter.lng, lat, lng))
    : undefined;
  const ratingVal = metadata.rating as { value?: number } | undefined;
  const photoVal = metadata.photo_url as { url?: string } | undefined;
  return {
    id: row.id,
    categoryId,
    featureKind: "place",
    title: row.name ?? EXPLORE_CATEGORY_LABELS[categoryId] ?? "Place",
    subtitle: row.primary_category ?? undefined,
    distanceMeters,
    filterValues: {},
    geometry: { kind: "point", lng, lat },
    placeId: row.id,
    preview: {
      categoryLabel: row.primary_category ?? undefined,
      rating: ratingVal?.value,
      thumbnailUrl: photoVal?.url,
    },
    detail: {
      placeId: row.id,
      name: row.name ?? "Place",
      subtitle: row.primary_category ?? undefined,
      lat,
      lng,
      categories: row.categories,
      pinCount: row.pin_count,
      prominenceScore: row.prominence_score,
      metadata,
    },
  };
}

export async function fetchPlacesInBbox(
  admin: ReturnType<typeof createClient>,
  bounds: ExploreBounds,
  categoryId: string,
  mapCenter: { lng: number; lat: number } | null,
  hiddenGems: boolean,
  limit = DATASET_LIMIT,
): Promise<ExploreResultEntry[]> {
  const categoryKey = categoryId.replace("poi:", "");
  const { data: rows, error } = await admin.rpc("places_in_bbox", {
    p_west: bounds.west,
    p_south: bounds.south,
    p_east: bounds.east,
    p_north: bounds.north,
    p_categories: [categoryKey],
    p_limit: limit,
  });
  if (error) throw error;

  let places = (rows ?? []) as PlaceRow[];
  if (hiddenGems) {
    places = [...places].sort(
      (a, b) =>
        b.prominence_score -
        a.prominence_score +
        (a.pin_count - b.pin_count) * 0.5,
    );
  }

  const metadataByPlace = await loadPlaceMetadataBatch(
    admin,
    places.map((row) => row.id),
  );

  return places.map((row) =>
    placeRowToEntry(
      row,
      categoryId,
      mapCenter,
      metadataByPlace.get(row.id) ?? {},
    ),
  );
}

export async function fetchPlaceEntryById(
  admin: ReturnType<typeof createClient>,
  placeId: string,
  categoryId: string,
  mapCenter: { lng: number; lat: number } | null,
): Promise<ExploreResultEntry | null> {
  const { data: row, error } = await admin
    .from("places")
    .select(
      "id, name, lat, lng, primary_category, categories, pin_count, prominence_score",
    )
    .eq("id", placeId)
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const metadataByPlace = await loadPlaceMetadataBatch(admin, [placeId]);
  return placeRowToEntry(
    row as PlaceRow,
    categoryId,
    mapCenter,
    metadataByPlace.get(placeId) ?? {},
  );
}

export async function fetchClustersInBbox(
  admin: ReturnType<typeof createClient>,
  bounds: ExploreBounds,
  categoryId: string,
): Promise<ExploreResultEntry[]> {
  const { data: clusters, error } = await admin.rpc("places_cluster_in_bbox", {
    p_west: bounds.west,
    p_south: bounds.south,
    p_east: bounds.east,
    p_north: bounds.north,
    p_cell_deg: CLUSTER_CELL_DEG,
    p_limit: CLUSTER_LIMIT,
  });
  if (error) throw error;

  return (clusters ?? []).map(
    (
      row: {
        cluster_lng: number;
        cluster_lat: number;
        place_count: number;
        top_prominence: number;
      },
      index: number,
    ) => ({
      id: `cluster-${index}-${row.cluster_lng.toFixed(2)}-${row.cluster_lat.toFixed(2)}`,
      categoryId,
      featureKind: "cluster" as const,
      title: `${row.place_count} places`,
      subtitle: "Zoom in to explore",
      filterValues: {},
      count: Number(row.place_count),
      geometry: {
        kind: "point" as const,
        lng: row.cluster_lng,
        lat: row.cluster_lat,
      },
      detail: {
        count: Number(row.place_count),
        zoomHint: "Zoom in to see individual places",
      },
    }),
  );
}
