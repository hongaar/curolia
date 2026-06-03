import {
  reversePhotonGeocode,
  reversePhotonPlaceDetails,
} from "@/lib/photon-geocode";
import {
  defaultLocationLabelDetail,
  pinGeocodeToJson,
} from "@/lib/pin-geocode";
import type { LinkMetadata } from "@/lib/pin-links";
import { supabase } from "@/lib/supabase";
import type { Pin } from "@/types/database";

export type CreatePinFromLinkOptions = {
  mapId: string;
  meta: LinkMetadata;
  /** Map zoom when reverse-geocoding (defaults to street-level). */
  zoom?: number;
};

/**
 * Creates a pin (and first pin link) from link metadata that includes coordinates.
 */
export async function createPinFromLinkMetadata({
  mapId,
  meta,
  zoom = 14,
}: CreatePinFromLinkOptions): Promise<Pin> {
  if (!meta.location) {
    throw new Error("This link does not include a location.");
  }

  const { lat, lng } = meta.location;
  const [{ shortTitle }, geocode] = await Promise.all([
    reversePhotonPlaceDetails(lat, lng, zoom),
    reversePhotonGeocode(lat, lng),
  ]);

  const labelDetail = defaultLocationLabelDetail(geocode);

  const title =
    meta.title?.trim() ||
    shortTitle?.trim() ||
    meta.location.label?.trim() ||
    null;

  const { data: row, error } = await supabase
    .from("pins")
    .insert({
      map_id: mapId,
      title,
      description: meta.description?.trim() || null,
      geocode: pinGeocodeToJson(geocode),
      location_label_detail: labelDetail,
      lat,
      lng,
    })
    .select("*")
    .single();

  if (error) throw error;

  const urlToStore = meta.finalUrl || meta.url;
  const { error: linkErr } = await supabase.from("pin_links").insert({
    map_id: mapId,
    pin_id: row.id,
    url: urlToStore,
    title: meta.title,
    favicon_url: meta.faviconUrl,
    sort_order: 0,
  });
  if (linkErr) throw linkErr;

  return row as Pin;
}
