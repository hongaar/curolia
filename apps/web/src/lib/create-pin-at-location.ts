import { supabase } from "@/lib/supabase";
import type { Pin } from "@/types/database";
import {
  defaultLocationLabelDetail,
  pinGeocodeToJson,
  reverseGeocodeDetails,
  reverseGeocodeForStorage,
} from "@curolia/services/geocoding";

/** Create a pin at map coordinates using the same title/label rules as map placement. */
export async function createPinAtLocation({
  mapId,
  lat,
  lng,
  zoom,
}: {
  mapId: string;
  lat: number;
  lng: number;
  zoom: number;
}): Promise<Pin> {
  const [{ shortTitle }, geocode] = await Promise.all([
    reverseGeocodeDetails(lat, lng, zoom),
    reverseGeocodeForStorage(lat, lng),
  ]);
  const labelDetail = defaultLocationLabelDetail(geocode);
  const { data: row, error } = await supabase
    .from("pins")
    .insert({
      map_id: mapId,
      title: shortTitle || null,
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
