import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type ExploreBounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};

type RouteGenerateBody = {
  action: "generate";
  bounds: ExploreBounds;
  profile: "hiking" | "cycling";
  maxDistanceMeters: number;
  mapCenter: { lng: number; lat: number };
  categoryId: string;
};

type OrsProfile = "foot-hiking" | "cycling-regular";

const ORS_BASE = "https://api.openrouteservice.org/v2/directions";

function cors(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(), "Content-Type": "application/json" },
  });
}

function orsProfile(profile: "hiking" | "cycling"): OrsProfile {
  return profile === "cycling" ? "cycling-regular" : "foot-hiking";
}

function categoryIdForProfile(profile: "hiking" | "cycling"): string {
  return profile === "cycling" ? "route:cycling" : "route:hiking";
}

type OrsFeature = {
  properties?: {
    summary?: {
      distance?: number;
      duration?: number;
      ascent?: number;
    };
  };
  geometry?: {
    coordinates?: [number, number][];
  };
};

async function fetchOrsRoundTrip(
  apiKey: string,
  profile: OrsProfile,
  lng: number,
  lat: number,
  lengthMeters: number,
  seedOffsetMeters: number,
): Promise<OrsFeature | null> {
  const latRad = (lat * Math.PI) / 180;
  const metersPerDegreeLat = 111_320;
  const metersPerDegreeLng = 111_320 * Math.cos(latRad);
  const seedLng = lng + seedOffsetMeters / metersPerDegreeLng;
  const seedLat = lat + seedOffsetMeters / metersPerDegreeLat;

  const res = await fetch(`${ORS_BASE}/${profile}/geojson`, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      coordinates: [[seedLng, seedLat]],
      options: {
        round_trip: {
          length: Math.max(1000, Math.round(lengthMeters)),
          points: 3,
        },
      },
    }),
    signal: AbortSignal.timeout(25_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`ors_http_${res.status}:${text.slice(0, 120)}`);
  }

  const json = (await res.json()) as { features?: OrsFeature[] };
  return json.features?.[0] ?? null;
}

function featureToEntry(
  feature: OrsFeature,
  index: number,
  categoryId: string,
  profile: "hiking" | "cycling",
  mapCenter: { lng: number; lat: number },
): Record<string, unknown> | null {
  const coords = feature.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;

  const summary = feature.properties?.summary;
  const distanceMeters = summary?.distance ?? 0;
  const ascentMeters = summary?.ascent;
  const durationSeconds = summary?.duration;

  const lineCoords = coords.map(([lng, lat]) => [lng, lat] as [number, number]);
  const first = lineCoords[0]!;

  const latRad = (mapCenter.lat * Math.PI) / 180;
  const metersPerDegreeLat = 111_320;
  const metersPerDegreeLng = 111_320 * Math.cos(latRad);
  const distanceFromCenter = Math.round(
    Math.hypot(
      (first[0] - mapCenter.lng) * metersPerDegreeLng,
      (first[1] - mapCenter.lat) * metersPerDegreeLat,
    ),
  );

  const profileLabel = profile === "cycling" ? "Cycling" : "Hiking";
  const distanceKm = (distanceMeters / 1000).toFixed(1);

  return {
    id: `route-${profile}-${index}-${Math.round(distanceMeters)}`,
    categoryId,
    featureKind: "route",
    title: `${profileLabel} loop ${index + 1}`,
    subtitle: `${distanceKm} km${ascentMeters ? ` · ${Math.round(ascentMeters)} m ascent` : ""}`,
    distanceMeters: distanceFromCenter,
    filterValues: { maxDistance: distanceMeters },
    geometry: { kind: "line", coordinates: lineCoords },
    detail: {
      profile,
      distanceMeters,
      ascentMeters,
      durationSeconds,
      coordinates: lineCoords,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors() });
  }
  if (req.method !== "POST") {
    return jsonResponse(405, { error: "method_not_allowed" });
  }

  const apiKey = Deno.env.get("ORS_API_KEY");
  if (!apiKey) {
    return jsonResponse(500, { error: "ors_api_key_missing" });
  }

  const body = (await req.json().catch(() => ({}))) as RouteGenerateBody;
  if (body.action !== "generate") {
    return jsonResponse(400, { error: "unknown_action" });
  }

  const profile = body.profile === "cycling" ? "cycling" : "hiking";
  const maxDistanceMeters = Math.max(
    1000,
    Math.min(50_000, Number(body.maxDistanceMeters) || 5000),
  );
  const mapCenter = body.mapCenter;
  if (
    !mapCenter ||
    !Number.isFinite(mapCenter.lat) ||
    !Number.isFinite(mapCenter.lng)
  ) {
    return jsonResponse(400, { error: "map_center_required" });
  }

  const categoryId = body.categoryId || categoryIdForProfile(profile);
  const ors = orsProfile(profile);

  try {
    const variants = [
      { length: maxDistanceMeters, offset: 0 },
      { length: Math.round(maxDistanceMeters * 0.85), offset: 120 },
    ];

    const entries: Record<string, unknown>[] = [];
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i]!;
      const feature = await fetchOrsRoundTrip(
        apiKey,
        ors,
        mapCenter.lng,
        mapCenter.lat,
        variant.length,
        variant.offset,
      );
      if (!feature) continue;
      const entry = featureToEntry(feature, i, categoryId, profile, mapCenter);
      if (entry) entries.push(entry);
    }

    return jsonResponse(200, { entries });
  } catch (e) {
    const message = e instanceof Error ? e.message : "route_generate_failed";
    console.error("route generate", message);
    return jsonResponse(502, { error: message });
  }
});
