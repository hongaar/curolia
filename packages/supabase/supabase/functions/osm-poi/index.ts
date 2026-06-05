import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/** Keep in sync with `packages/plugins/osm-poi/src/constants.ts`. */
const SEARCH_RADIUS_M = 40;
const COORD_EPSILON = 0.0001;
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const PLUGIN_TYPE_ID = "osm-poi";

const OVERPASS_API = "https://overpass-api.de/api/interpreter";
const USER_AGENT =
  "Curolia/1.0 (https://github.com/curolia/curolia; plugin-osm-poi)";

type OsmPoiPinPayload = {
  schemaVersion: 1;
  lat: number;
  lng: number;
  fetchedAt: string;
  noPoi?: boolean;
  osmType?: "node" | "way" | "relation";
  osmId?: number;
  distanceM?: number;
  tags?: Record<string, string>;
};

type PinRow = {
  id: string;
  map_id: string;
  lat: number | null;
  lng: number | null;
};

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function cors(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function haversineM(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function elementCoords(
  el: OverpassElement,
): { lat: number; lng: number } | null {
  if (typeof el.lat === "number" && typeof el.lon === "number") {
    return { lat: el.lat, lng: el.lon };
  }
  if (
    el.center &&
    typeof el.center.lat === "number" &&
    typeof el.center.lon === "number"
  ) {
    return { lat: el.center.lat, lng: el.center.lon };
  }
  return null;
}

function hasPoiTags(tags: Record<string, string> | undefined): boolean {
  if (!tags) return false;
  return Boolean(
    tags.amenity ||
    tags.shop ||
    tags.tourism ||
    tags.leisure ||
    tags.man_made ||
    tags.historic ||
    tags.office ||
    tags.healthcare ||
    tags.craft,
  );
}

function normalizeTags(
  tags: Record<string, string> | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!tags) return out;
  for (const [key, value] of Object.entries(tags)) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

function buildOverpassQuery(lat: number, lng: number, radiusM: number): string {
  return `
[out:json][timeout:15];
(
  node(around:${radiusM},${lat},${lng})["amenity"];
  node(around:${radiusM},${lat},${lng})["shop"];
  node(around:${radiusM},${lat},${lng})["tourism"];
  node(around:${radiusM},${lat},${lng})["leisure"];
  node(around:${radiusM},${lat},${lng})["man_made"];
  node(around:${radiusM},${lat},${lng})["historic"];
  way(around:${radiusM},${lat},${lng})["amenity"];
  way(around:${radiusM},${lat},${lng})["shop"];
  way(around:${radiusM},${lat},${lng})["tourism"];
  way(around:${radiusM},${lat},${lng})["leisure"];
  way(around:${radiusM},${lat},${lng})["man_made"];
  way(around:${radiusM},${lat},${lng})["historic"];
);
out center tags;
`.trim();
}

async function queryNearestPoi(
  lat: number,
  lng: number,
): Promise<OsmPoiPinPayload | null> {
  const query = buildOverpassQuery(lat, lng, SEARCH_RADIUS_M);
  const res = await fetch(OVERPASS_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) {
    throw new Error(`overpass_http_${res.status}`);
  }

  const json = (await res.json()) as { elements?: OverpassElement[] };
  const elements = json.elements ?? [];

  let best: {
    el: OverpassElement;
    distanceM: number;
    coords: { lat: number; lng: number };
  } | null = null;

  for (const el of elements) {
    if (!hasPoiTags(el.tags)) continue;
    const coords = elementCoords(el);
    if (!coords) continue;
    const distanceM = haversineM(lat, lng, coords.lat, coords.lng);
    if (distanceM > SEARCH_RADIUS_M) continue;
    if (!best || distanceM < best.distanceM) {
      best = { el, distanceM, coords };
    }
  }

  const fetchedAt = new Date().toISOString();
  if (!best) {
    return {
      schemaVersion: 1,
      lat,
      lng,
      fetchedAt,
      noPoi: true,
    };
  }

  return {
    schemaVersion: 1,
    lat,
    lng,
    fetchedAt,
    osmType: best.el.type,
    osmId: best.el.id,
    distanceM: Math.round(best.distanceM),
    tags: normalizeTags(best.el.tags),
  };
}

function parsePayload(raw: unknown): OsmPoiPinPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.schemaVersion !== 1) return null;
  if (typeof o.lat !== "number" || typeof o.lng !== "number") return null;
  if (typeof o.fetchedAt !== "string") return null;
  return raw as OsmPoiPinPayload;
}

function payloadMatches(
  payload: OsmPoiPinPayload,
  lat: number,
  lng: number,
): boolean {
  if (
    Math.abs(payload.lat - lat) >= COORD_EPSILON ||
    Math.abs(payload.lng - lng) >= COORD_EPSILON
  ) {
    return false;
  }
  const age = Date.now() - new Date(payload.fetchedAt).getTime();
  return age >= 0 && age <= CACHE_MAX_AGE_MS;
}

async function upsertPayload(
  admin: ReturnType<typeof createClient>,
  mapId: string,
  pinId: string,
  payload: OsmPoiPinPayload,
): Promise<void> {
  const { error } = await admin.from("plugin_entity_data").upsert(
    {
      map_id: mapId,
      entity_type: "pin",
      entity_id: pinId,
      plugin_type_id: PLUGIN_TYPE_ID,
      data: payload as unknown as Record<string, unknown>,
    },
    { onConflict: "entity_type,entity_id,plugin_type_id" },
  );
  if (error) throw error;
}

type PinMetadataFieldKey =
  | "phone"
  | "website"
  | "opening_hours"
  | "email"
  | "place_name"
  | "place_type"
  | "cuisine"
  | "wheelchair_access"
  | "dog_policy"
  | "brand"
  | "operator"
  | "dietary_options"
  | "place_categories";

type PinMetadataUpsert = {
  field_key: PinMetadataFieldKey;
  value: Record<string, unknown>;
};

const FOOD_AMENITIES = new Set([
  "restaurant",
  "cafe",
  "fast_food",
  "bar",
  "pub",
  "food_court",
  "ice_cream",
  "bakery",
  "biergarten",
  "bbq",
  "nightclub",
  "canteen",
]);
const FOOD_SHOPS = new Set([
  "bakery",
  "butcher",
  "confectionery",
  "deli",
  "greengrocer",
  "seafood",
  "wine",
  "alcohol",
  "cheese",
  "chocolate",
]);
const OUTDOOR_TOURISM = new Set([
  "camp_site",
  "caravan_site",
  "picnic_site",
  "viewpoint",
  "wilderness_hut",
  "alpine_hut",
  "hostel",
  "hotel",
  "motel",
  "guest_hut",
]);
const OUTDOOR_AMENITIES = new Set([
  "fuel",
  "sanitary_dump_station",
  "charging_station",
  "bicycle_rental",
  "toilets",
]);
const OUTDOOR_LEISURE = new Set([
  "park",
  "playground",
  "nature_reserve",
  "marina",
  "pitch",
  "track",
  "slipway",
]);
const PRIMARY_TYPE_KEYS = [
  "amenity",
  "shop",
  "tourism",
  "leisure",
  "man_made",
  "historic",
  "office",
  "healthcare",
  "craft",
];
function formatOpeningHoursDisplay(raw: string): string {
  return raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n");
}

function normalizeWebsiteUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

function normalizePhoneTel(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/[^\d+]/g, "");
  if (!digits || digits === "+") return null;
  return digits;
}

function firstTag(tags: Record<string, string>, keys: string[]): string | null {
  for (const key of keys) {
    const value = tags[key]?.trim();
    if (value) return value;
  }
  return null;
}

function titleCaseToken(token: string): string {
  const t = token.trim();
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

function formatTagValue(value: string): string {
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map(titleCaseToken)
    .join(" ");
}

function formatCuisine(value: string): string {
  return value
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) =>
      part
        .split(/[_\s]+/)
        .filter(Boolean)
        .map(titleCaseToken)
        .join(" "),
    )
    .join(", ");
}

function primaryPoiLabel(tags: Record<string, string>): string | null {
  for (const key of PRIMARY_TYPE_KEYS) {
    const value = tags[key]?.trim();
    if (value) return formatTagValue(value);
  }
  return null;
}

function isFoodPoi(tags: Record<string, string>): boolean {
  const amenity = tags.amenity;
  if (amenity && FOOD_AMENITIES.has(amenity)) return true;
  const shop = tags.shop;
  if (shop && FOOD_SHOPS.has(shop)) return true;
  return Boolean(tags.cuisine?.trim());
}

function isOutdoorPoi(tags: Record<string, string>): boolean {
  const tourism = tags.tourism;
  if (tourism && OUTDOOR_TOURISM.has(tourism)) return true;
  const amenity = tags.amenity;
  if (amenity && OUTDOOR_AMENITIES.has(amenity)) return true;
  const leisure = tags.leisure;
  if (leisure && OUTDOOR_LEISURE.has(leisure)) return true;
  return false;
}

function parseWheelchairLevel(value: string | undefined): string | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (v === "yes" || v === "designated" || v === "limited" || v === "no")
    return v;
  return null;
}

function parseDogLevel(value: string | undefined): string | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (v === "yes" || v === "leashed" || v === "no") return v;
  return null;
}

function dietaryLabelsFromTags(tags: Record<string, string>): string[] {
  const labels: string[] = [];
  for (const [key, raw] of Object.entries(tags)) {
    if (!key.startsWith("diet:")) continue;
    const value = raw.trim().toLowerCase();
    if (value !== "yes" && value !== "only") continue;
    const slug = key.slice(5);
    if (!slug) continue;
    const label = formatTagValue(slug);
    labels.push(value === "only" ? `${label} only` : label);
  }
  return labels;
}

/** Keep in sync with `packages/plugins/osm-poi/src/osm-poi-pin-metadata.ts`. */
function pinMetadataFromOsmTags(
  tags: Record<string, string>,
): PinMetadataUpsert[] {
  const fields: PinMetadataUpsert[] = [];

  const placeName = tags.name?.trim();
  if (placeName)
    fields.push({ field_key: "place_name", value: { label: placeName } });

  const placeType = primaryPoiLabel(tags);
  if (placeType)
    fields.push({ field_key: "place_type", value: { label: placeType } });

  const cuisineRaw = tags.cuisine?.trim();
  if (cuisineRaw) {
    fields.push({
      field_key: "cuisine",
      value: { label: formatCuisine(cuisineRaw) },
    });
  }

  const dietary = dietaryLabelsFromTags(tags);
  if (dietary.length > 0) {
    fields.push({ field_key: "dietary_options", value: { labels: dietary } });
  }

  const wheelchair = parseWheelchairLevel(tags.wheelchair);
  if (wheelchair) {
    fields.push({
      field_key: "wheelchair_access",
      value: { level: wheelchair },
    });
  }

  const dog = parseDogLevel(tags.dog);
  if (dog) fields.push({ field_key: "dog_policy", value: { level: dog } });

  const brand = tags.brand?.trim();
  if (brand) fields.push({ field_key: "brand", value: { label: brand } });

  const operator = tags.operator?.trim();
  if (operator)
    fields.push({ field_key: "operator", value: { label: operator } });

  const phoneRaw = firstTag(tags, [
    "phone",
    "contact:phone",
    "contact:mobile",
    "mobile",
  ]);
  if (phoneRaw) {
    const tel = normalizePhoneTel(phoneRaw);
    if (tel) {
      fields.push({
        field_key: "phone",
        value: { tel, ...(phoneRaw !== tel ? { display: phoneRaw } : {}) },
      });
    }
  }

  const websiteRaw = firstTag(tags, [
    "website",
    "contact:website",
    "url",
    "contact:url",
  ]);
  if (websiteRaw) {
    const url = normalizeWebsiteUrl(websiteRaw);
    if (url) fields.push({ field_key: "website", value: { url } });
  }

  const emailRaw = firstTag(tags, ["email", "contact:email"]);
  if (emailRaw && emailRaw.includes("@")) {
    fields.push({ field_key: "email", value: { email: emailRaw } });
  }

  const hoursRaw = tags.opening_hours?.trim();
  if (hoursRaw) {
    fields.push({
      field_key: "opening_hours",
      value: { raw: hoursRaw, display: formatOpeningHoursDisplay(hoursRaw) },
    });
  }

  fields.push({
    field_key: "place_categories",
    value: { food: isFoodPoi(tags), outdoor: isOutdoorPoi(tags) },
  });

  return fields;
}

async function replacePinMetadataForSource(
  admin: ReturnType<typeof createClient>,
  mapId: string,
  pinId: string,
  tags: Record<string, string> | null | undefined,
): Promise<void> {
  const { error: deleteErr } = await admin
    .from("pin_metadata")
    .delete()
    .eq("pin_id", pinId)
    .eq("source_plugin_id", PLUGIN_TYPE_ID);
  if (deleteErr) throw deleteErr;

  if (!tags) return;
  const fields = pinMetadataFromOsmTags(tags);
  if (fields.length === 0) return;

  const { error: insertErr } = await admin.from("pin_metadata").insert(
    fields.map((field) => ({
      pin_id: pinId,
      map_id: mapId,
      field_key: field.field_key,
      source_plugin_id: PLUGIN_TYPE_ID,
      value: field.value,
    })),
  );
  if (insertErr) throw insertErr;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors() });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization");
  const jwt = authHeader?.replace(/^Bearer\s+/i, "") ?? "";
  if (!jwt) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser(jwt);
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: "invalid_session" }), {
      status: 401,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }
  const userId = userData.user.id;
  const admin = createClient(supabaseUrl, serviceKey);

  let body: { action?: string; pinId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  if (body.action !== "sync_pin_poi" || !body.pinId) {
    return new Response(JSON.stringify({ error: "invalid_body" }), {
      status: 400,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const { data: pin, error: pinErr } = await admin
    .from("pins")
    .select("id, map_id, lat, lng")
    .eq("id", body.pinId)
    .maybeSingle();

  if (pinErr) {
    return new Response(JSON.stringify({ error: pinErr.message }), {
      status: 500,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }
  if (!pin) {
    return new Response(JSON.stringify({ error: "pin_not_found" }), {
      status: 404,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const t = pin as PinRow;
  const { data: mem } = await admin
    .from("map_members")
    .select("user_id")
    .eq("map_id", t.map_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!mem) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const { data: mapPlugin } = await admin
    .from("map_plugins")
    .select("enabled")
    .eq("map_id", t.map_id)
    .eq("plugin_type_id", PLUGIN_TYPE_ID)
    .maybeSingle();

  if (!mapPlugin || mapPlugin.enabled !== true) {
    return new Response(
      JSON.stringify({ skippedReason: "map_plugin_disabled" }),
      {
        status: 200,
        headers: { ...cors(), "Content-Type": "application/json" },
      },
    );
  }

  const lat = t.lat;
  const lng = t.lng;
  if (
    lat == null ||
    lng == null ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return new Response(JSON.stringify({ skippedReason: "no_coordinates" }), {
      status: 200,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const { data: cachedRow } = await admin
    .from("plugin_entity_data")
    .select("data")
    .eq("entity_type", "pin")
    .eq("entity_id", t.id)
    .eq("plugin_type_id", PLUGIN_TYPE_ID)
    .maybeSingle();

  const cached = parsePayload(cachedRow?.data);
  if (cached && payloadMatches(cached, lat, lng)) {
    await replacePinMetadataForSource(
      admin,
      t.map_id,
      t.id,
      cached.noPoi ? null : cached.tags,
    );
    if (cached.noPoi) {
      return new Response(
        JSON.stringify({
          synced: false,
          reason: "nothing_nearby",
          payload: cached,
        }),
        {
          status: 200,
          headers: { ...cors(), "Content-Type": "application/json" },
        },
      );
    }
    return new Response(JSON.stringify({ synced: true, payload: cached }), {
      status: 200,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await queryNearestPoi(lat, lng);
    if (!payload) {
      return new Response(JSON.stringify({ error: "overpass_empty" }), {
        status: 502,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    await upsertPayload(admin, t.map_id, t.id, payload);
    await replacePinMetadataForSource(
      admin,
      t.map_id,
      t.id,
      payload.noPoi ? null : payload.tags,
    );

    if (payload.noPoi) {
      return new Response(
        JSON.stringify({
          synced: false,
          reason: "nothing_nearby",
          payload,
        }),
        {
          status: 200,
          headers: { ...cors(), "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ synced: true, payload }), {
      status: 200,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "overpass_failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }
});
