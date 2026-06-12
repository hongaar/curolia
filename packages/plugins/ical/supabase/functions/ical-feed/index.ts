import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

import { buildCalendar, type IcalPinRow } from "./lib/build-calendar.ts";

const DEFAULT_SITE_ORIGIN = "https://curolia.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token")?.trim();
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    return new Response("Not found", {
      status: 404,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response("Server misconfigured", { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: pluginRow, error: pluginErr } = await admin
    .from("map_plugins")
    .select("map_id, config")
    .eq("plugin_type_id", "ical")
    .filter("config->>feedToken", "eq", token)
    .maybeSingle();

  if (pluginErr || !pluginRow?.map_id) {
    return new Response("Not found", {
      status: 404,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  const mapId = pluginRow.map_id as string;
  const cfg = pluginRow.config as Record<string, unknown> | null;
  const publish = cfg?.publishFeed === true;
  if (!publish) {
    return new Response("Not found", {
      status: 404,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  const { data: ownerRow, error: ownerErr } = await admin
    .from("map_members")
    .select("user_id")
    .eq("map_id", mapId)
    .eq("role", "owner")
    .maybeSingle();

  if (ownerErr || !ownerRow?.user_id) {
    return new Response("Not found", {
      status: 404,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  const { data: uc, error: ucErr } = await admin
    .from("user_plugins")
    .select("enabled")
    .eq("user_id", ownerRow.user_id as string)
    .eq("plugin_type_id", "ical")
    .maybeSingle();

  if (ucErr || !uc?.enabled) {
    return new Response("Not found", {
      status: 404,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  const { data: ownerProfile, error: profileErr } = await admin
    .from("profiles")
    .select("slug")
    .eq("id", ownerRow.user_id as string)
    .maybeSingle();

  if (profileErr || !ownerProfile?.slug) {
    return new Response("Not found", {
      status: 404,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  const { data: map, error: jErr } = await admin
    .from("maps")
    .select("name, slug")
    .eq("id", mapId)
    .single();
  if (jErr || !map?.slug) {
    return new Response("Not found", {
      status: 404,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  const { data: pins, error: tErr } = await admin
    .from("pins")
    .select(
      "id, slug, title, description, geocode, location_label_detail, lat, lng, date, end_date",
    )
    .eq("map_id", mapId)
    .order("date", { ascending: true, nullsFirst: false });

  if (tErr) {
    return new Response("Error", {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  const siteOrigin =
    Deno.env.get("PUBLIC_APP_ORIGIN")?.trim() || DEFAULT_SITE_ORIGIN;

  const body = buildCalendar({
    mapName: (map.name as string) || "Untitled map",
    mapId,
    profileSlug: ownerProfile.slug as string,
    mapSlug: map.slug as string,
    siteOrigin,
    pins: (pins ?? []) as IcalPinRow[],
  });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "private, max-age=60",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
