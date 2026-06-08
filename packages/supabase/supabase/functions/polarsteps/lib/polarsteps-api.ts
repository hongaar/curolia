import { buildTripApiUrl } from "./share-url.ts";

const API_VERSION = "62";

export type PolarstepsApiLocation = {
  lat?: number;
  lon?: number;
  locality?: string;
  name?: string;
  country?: string;
};

export type PolarstepsApiMedia = {
  id: number;
  uuid: string;
  type?: number;
  path?: string | null;
  cdn_path?: string | null;
  small_thumbnail_path?: string | null;
  large_thumbnail_path?: string | null;
  full_res_width?: number | null;
  full_res_height?: number | null;
  order?: number | null;
  is_deleted?: boolean | null;
};

export type PolarstepsApiStep = {
  id: number;
  uuid: string;
  trip_id?: number;
  location?: PolarstepsApiLocation | null;
  start_time?: number | string | null;
  end_time?: number | string | null;
  name?: string | null;
  display_name?: string | null;
  slug?: string | null;
  display_slug?: string | null;
  description?: string | null;
  is_deleted?: boolean | null;
  media?: PolarstepsApiMedia[] | null;
};

export type PolarstepsApiTrip = {
  id: number;
  name?: string | null;
  display_name?: string | null;
  slug?: string | null;
  start_date?: number | string | null;
  end_date?: number | string | null;
  steps?: PolarstepsApiStep[] | null;
  all_steps?: PolarstepsApiStep[] | null;
};

export async function fetchPolarstepsTrip(
  tripId: string,
  secret?: string,
): Promise<PolarstepsApiTrip> {
  const res = await fetch(buildTripApiUrl(tripId, secret), {
    headers: {
      Accept: "application/json",
      "polarsteps-api-version": API_VERSION,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      res.status === 404
        ? "Trip not found. Check the share link — private trips need the secret (?s=) parameter."
        : `Polarsteps API error (${res.status})${text ? `: ${text.slice(0, 120)}` : ""}`,
    );
  }

  return (await res.json()) as PolarstepsApiTrip;
}

export function tripSteps(trip: PolarstepsApiTrip): PolarstepsApiStep[] {
  const raw = trip.all_steps ?? trip.steps ?? [];
  return raw.filter((s) => s && s.is_deleted !== true);
}
