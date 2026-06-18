import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  FLICKR_NEARBY_CANDIDATES_LIMIT,
  flickrExternalRef,
  parseFlickrCandidate,
  searchFlickrNearby,
  type FlickrNearbyCandidate,
} from "./lib/flickr-api.ts";

const PLUGIN_ID = "flickr";

type PinRow = {
  id: string;
  map_id: string;
  lat: number | null;
  lng: number | null;
};

type RequestBody = {
  action?: string;
  pinId?: string;
  candidates?: unknown[];
};

function cors(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

async function assertMapMember(
  admin: ReturnType<typeof createClient>,
  mapId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await admin
    .from("map_members")
    .select("user_id")
    .eq("map_id", mapId)
    .eq("user_id", userId)
    .maybeSingle();
  return !error && Boolean(data);
}

async function loadPinForUser(
  admin: ReturnType<typeof createClient>,
  userId: string,
  pinId: string,
): Promise<
  | { ok: true; pin: PinRow }
  | { ok: false; status: number; body: Record<string, unknown> }
> {
  const { data: pin, error: pinErr } = await admin
    .from("pins")
    .select("id, map_id, lat, lng")
    .eq("id", pinId)
    .maybeSingle();

  if (pinErr || !pin) {
    return { ok: false, status: 404, body: { error: "pin_not_found" } };
  }

  const row = pin as PinRow;
  if (!(await assertMapMember(admin, row.map_id, userId))) {
    return { ok: false, status: 403, body: { error: "forbidden" } };
  }

  return { ok: true, pin: row };
}

async function existingFlickrPhotoIds(
  admin: ReturnType<typeof createClient>,
  pinId: string,
): Promise<Set<string>> {
  const { data, error } = await admin
    .from("photos")
    .select("external_ref")
    .eq("pin_id", pinId)
    .eq("source_plugin_id", PLUGIN_ID);
  if (error || !data) return new Set();

  const ids = new Set<string>();
  for (const row of data) {
    const ref = row.external_ref as { photoId?: unknown } | null;
    if (typeof ref?.photoId === "string") ids.add(ref.photoId);
  }
  return ids;
}

async function maxPhotoSortOrder(
  admin: ReturnType<typeof createClient>,
  pinId: string,
): Promise<number> {
  const { data, error } = await admin
    .from("photos")
    .select("sort_order")
    .eq("pin_id", pinId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return 0;
  const sort = (data as { sort_order?: number }).sort_order;
  return typeof sort === "number" ? sort : 0;
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
  const flickrApiKey = Deno.env.get("FLICKR_API_KEY")?.trim() ?? "";

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

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return new Response(JSON.stringify({ error: "bad_json" }), {
      status: 400,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const { data: userPlugin } = await admin
    .from("user_plugins")
    .select("enabled")
    .eq("user_id", userId)
    .eq("plugin_type_id", PLUGIN_ID)
    .maybeSingle();

  if (!userPlugin?.enabled) {
    return new Response(JSON.stringify({ error: "plugin_disabled" }), {
      status: 403,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  if (!flickrApiKey) {
    return new Response(JSON.stringify({ error: "flickr_not_configured" }), {
      status: 503,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const pinId = body.pinId?.trim();
  if (!pinId) {
    return new Response(JSON.stringify({ error: "invalid_body" }), {
      status: 400,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const loaded = await loadPinForUser(admin, userId, pinId);
  if (!loaded.ok) {
    return new Response(JSON.stringify(loaded.body), {
      status: loaded.status,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const { pin } = loaded;
  const lat = pin.lat;
  const lng = pin.lng;
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return new Response(JSON.stringify({ error: "no_coordinates" }), {
      status: 400,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  if (body.action === "list_nearby") {
    try {
      const existing = await existingFlickrPhotoIds(admin, pinId);
      const candidates = (
        await searchFlickrNearby(
          flickrApiKey,
          lat,
          lng,
          FLICKR_NEARBY_CANDIDATES_LIMIT,
        )
      ).filter((c) => !existing.has(c.photoId));

      return new Response(JSON.stringify({ candidates }), {
        status: 200,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("flickr list_nearby failed", e);
      return new Response(JSON.stringify({ error: "flickr_search_failed" }), {
        status: 502,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }
  }

  if (body.action === "attach") {
    const rawCandidates = Array.isArray(body.candidates) ? body.candidates : [];
    const parsed: FlickrNearbyCandidate[] = [];
    for (const raw of rawCandidates) {
      const candidate = parseFlickrCandidate(raw);
      if (candidate) parsed.push(candidate);
    }
    if (parsed.length === 0) {
      return new Response(JSON.stringify({ error: "no_candidates" }), {
        status: 400,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    const existing = await existingFlickrPhotoIds(admin, pinId);
    let sort = await maxPhotoSortOrder(admin, pinId);
    const attachedIds: string[] = [];
    const skippedAlreadyOnPin: string[] = [];

    for (const candidate of parsed) {
      if (existing.has(candidate.photoId)) {
        skippedAlreadyOnPin.push(candidate.photoId);
        continue;
      }

      sort += 1;
      const external_ref = flickrExternalRef(candidate);
      const { data: ins, error: insErr } = await admin
        .from("photos")
        .insert({
          map_id: pin.map_id,
          pin_id: pin.id,
          storage_path: null,
          sort_order: sort,
          source_plugin_id: PLUGIN_ID,
          external_ref,
          captured_at: candidate.capturedAt,
          ...(candidate.width != null && candidate.height != null
            ? { width: candidate.width, height: candidate.height }
            : {}),
        })
        .select("id")
        .single();

      if (insErr || !ins?.id) {
        console.error(insErr);
        continue;
      }

      attachedIds.push(ins.id as string);
      existing.add(candidate.photoId);
    }

    return new Response(JSON.stringify({ attachedIds, skippedAlreadyOnPin }), {
      status: 200,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "unknown_action" }), {
    status: 400,
    headers: { ...cors(), "Content-Type": "application/json" },
  });
});
