import { supabase } from "@/lib/supabase";
import type { Pin } from "@/types/database";
import {
  defaultLocationLabelDetail,
  enrichGeocodeFromSearchPlace,
  pinGeocodeToJson,
  placeTitleZoomForCategory,
  reverseGeocodeDetails,
  reverseGeocodeForStorage,
  type PlaceSearchResult,
} from "@curolia/services/geocoding";

/** Create a pin at map coordinates using the same title/label rules as map placement. */
export async function createPinAtLocation({
  mapId,
  lat,
  lng,
  zoom,
  searchPlace,
}: {
  mapId: string;
  lat: number;
  lng: number;
  zoom: number;
  /** When set (e.g. global search pick), title/label follow the selected place. */
  searchPlace?: Pick<
    PlaceSearchResult,
    "primaryName" | "fullLabel" | "categoryLabel"
  >;
}): Promise<Pin> {
  const titleZoom = searchPlace
    ? placeTitleZoomForCategory(searchPlace.categoryLabel)
    : zoom;
  const [{ shortTitle }, geocodeRaw] = await Promise.all([
    reverseGeocodeDetails(lat, lng, titleZoom),
    reverseGeocodeForStorage(lat, lng),
  ]);
  const geocode =
    geocodeRaw && searchPlace
      ? enrichGeocodeFromSearchPlace(geocodeRaw, searchPlace)
      : geocodeRaw;
  const title = searchPlace?.primaryName.trim() || shortTitle?.trim() || null;
  const labelDetail = defaultLocationLabelDetail(geocode);
  const { data: row, error } = await supabase
    .from("pins")
    .insert({
      map_id: mapId,
      title,
      geocode: pinGeocodeToJson(geocode),
      location_label_detail: labelDetail,
      lat,
      lng,
    })
    .select("*")
    .single();
  if (error) throw error;
  return row as Pin;
}
