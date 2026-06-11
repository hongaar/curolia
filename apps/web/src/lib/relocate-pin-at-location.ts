import { supabase } from "@/lib/supabase";
import {
  defaultLocationLabelDetail,
  pinGeocodeToJson,
  reverseGeocodeForStorage,
} from "@curolia/services/geocoding";

/** Update a pin's map coordinates and refresh stored geocode/label. */
export async function relocatePinAtLocation({
  pinId,
  lat,
  lng,
}: {
  pinId: string;
  lat: number;
  lng: number;
}): Promise<void> {
  const geocode = await reverseGeocodeForStorage(lat, lng);
  const labelDetail = defaultLocationLabelDetail(geocode);
  const { error } = await supabase
    .from("pins")
    .update({
      geocode: pinGeocodeToJson(geocode),
      location_label_detail: labelDetail,
      lat,
      lng,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pinId);
  if (error) throw error;
}
