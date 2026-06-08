import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  importTripsToMap,
  mergeImportedTripIds,
  PLUGIN_TYPE_ID,
  type ImportSource,
  type ImportSummary,
} from "./lib/import-steps.ts";
import { fetchPolarstepsTrip } from "./lib/polarsteps-api.ts";
import { parseTrip, tripPreviewFromParsed } from "./lib/parse-trip.ts";
import { parsePolarstepsShareUrl } from "./lib/share-url.ts";
import {
  listCachedTrips,
  loadUserPolarstepsData,
  patchUserPolarstepsData,
} from "./lib/user-cache.ts";

function cors(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(), "Content-Type": "application/json" },
  });
}

type PolarstepsImportJobStatus =
  | "pending"
  | "fetching"
  | "importing"
  | "completed"
  | "failed";

type ImportJob = {
  id: string;
  status: PolarstepsImportJobStatus;
  phase?: string;
  processed: number;
  total: number;
  partialSummary?: ImportSummary;
  summary?: ImportSummary;
  error?: string;
  startedAt: string;
  finishedAt?: string;
  sources: ImportSource[];
};

type MapPluginConfig = {
  lastSyncAt?: string;
  lastSyncSummary?: ImportSummary;
  importJob?: ImportJob;
  importedTripIds?: string[];
};

async function assertMapMember(
  admin: ReturnType<typeof createClient>,
  userId: string,
  mapId: string,
): Promise<boolean> {
  const { data } = await admin
    .from("map_members")
    .select("user_id")
    .eq("map_id", mapId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

async function readMapPluginConfig(
  admin: ReturnType<typeof createClient>,
  mapId: string,
): Promise<MapPluginConfig> {
  const { data } = await admin
    .from("map_plugins")
    .select("config")
    .eq("map_id", mapId)
    .eq("plugin_type_id", PLUGIN_TYPE_ID)
    .maybeSingle();
  return (data?.config ?? {}) as MapPluginConfig;
}

function isImportJobActive(job: ImportJob | undefined): boolean {
  return (
    job?.status === "pending" ||
    job?.status === "fetching" ||
    job?.status === "importing"
  );
}

async function patchImportJob(
  admin: ReturnType<typeof createClient>,
  mapId: string,
  cfg: MapPluginConfig,
  patch: Partial<ImportJob>,
): Promise<void> {
  const importJob = { ...cfg.importJob!, ...patch };
  await admin.from("map_plugins").upsert(
    {
      map_id: mapId,
      plugin_type_id: PLUGIN_TYPE_ID,
      enabled: true,
      config: { ...cfg, importJob },
      status: "connected",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "map_id,plugin_type_id" },
  );
}

async function runImportJob(
  admin: ReturnType<typeof createClient>,
  mapId: string,
  sources: ImportSource[],
  jobId: string,
): Promise<void> {
  const cfg = await readMapPluginConfig(admin, mapId);

  try {
    await patchImportJob(admin, mapId, cfg, {
      status: "fetching",
      phase: "Fetching trips from Polarsteps…",
    });

    const trips = [];
    const importedTripIds: string[] = [];

    for (const source of sources) {
      const parsedUrl = parsePolarstepsShareUrl(source.shareUrl);
      if (!parsedUrl) {
        throw new Error("Invalid Polarsteps share URL.");
      }
      const apiTrip = await fetchPolarstepsTrip(
        parsedUrl.tripId,
        parsedUrl.secret,
      );
      trips.push(parseTrip(apiTrip, parsedUrl.shareUrl));
      importedTripIds.push(parsedUrl.tripId);
    }

    const totalSteps = trips.reduce((n, t) => n + t.stepCount, 0);
    const freshCfg = await readMapPluginConfig(admin, mapId);
    await patchImportJob(admin, mapId, freshCfg, {
      status: "importing",
      phase: "Importing steps…",
      total: totalSteps,
      processed: 0,
    });

    const summary = await importTripsToMap(admin, mapId, trips, {
      onProgress: async (update) => {
        const c = await readMapPluginConfig(admin, mapId);
        await patchImportJob(admin, mapId, c, {
          status: "importing",
          phase: update.phase ?? "Importing steps…",
          processed: update.processed,
          total: update.total,
          partialSummary: update.summary,
        });
      },
    });

    const finishedAt = new Date().toISOString();
    const finalCfg = await readMapPluginConfig(admin, mapId);
    await admin.from("map_plugins").upsert(
      {
        map_id: mapId,
        plugin_type_id: PLUGIN_TYPE_ID,
        enabled: true,
        config: {
          ...finalCfg,
          lastSyncAt: finishedAt,
          lastSyncSummary: summary,
          importedTripIds: mergeImportedTripIds(
            finalCfg.importedTripIds,
            importedTripIds,
          ),
          importJob: {
            ...finalCfg.importJob!,
            status: "completed",
            phase: "Import complete",
            processed: totalSteps,
            total: totalSteps,
            summary,
            finishedAt,
          },
        },
        status: "connected",
        updated_at: finishedAt,
      },
      { onConflict: "map_id,plugin_type_id" },
    );
  } catch (e) {
    console.error("polarsteps import failed", mapId, jobId, e);
    const message = e instanceof Error ? e.message : String(e);
    const failedCfg = await readMapPluginConfig(admin, mapId);
    await patchImportJob(admin, mapId, failedCfg, {
      status: "failed",
      phase: "Import failed",
      error: message || "Import failed.",
      finishedAt: new Date().toISOString(),
    });
  }
}

async function handleListTrips(
  admin: ReturnType<typeof createClient>,
  userId: string,
) {
  const data = await loadUserPolarstepsData(admin, userId);
  return json(200, { trips: listCachedTrips(data) });
}

async function handlePreviewTrip(
  admin: ReturnType<typeof createClient>,
  userId: string,
  shareUrl: string,
) {
  const parsedUrl = parsePolarstepsShareUrl(shareUrl);
  if (!parsedUrl) {
    return json(400, {
      error: "invalid_share_url",
      message: "Paste a valid Polarsteps trip share link.",
    });
  }

  try {
    const apiTrip = await fetchPolarstepsTrip(
      parsedUrl.tripId,
      parsedUrl.secret,
    );
    const parsed = parseTrip(apiTrip, parsedUrl.shareUrl);
    const trip = tripPreviewFromParsed(parsed, parsedUrl.shareUrl);

    await patchUserPolarstepsData(admin, userId, {
      trips: { [trip.tripId]: trip },
    });

    return json(200, { trip });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return json(502, {
      error: "fetch_failed",
      message: message || "Could not fetch trip from Polarsteps.",
    });
  }
}

async function handleImport(
  admin: ReturnType<typeof createClient>,
  mapId: string,
  sources: ImportSource[],
) {
  if (!sources.length) {
    return json(400, {
      error: "no_sources",
      message: "Choose at least one trip to import.",
    });
  }

  const cfg = await readMapPluginConfig(admin, mapId);
  if (isImportJobActive(cfg.importJob)) {
    return json(409, {
      error: "import_in_progress",
      message: "An import is already running for this map.",
      importJob: cfg.importJob,
    });
  }

  const jobId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const importJob: ImportJob = {
    id: jobId,
    status: "pending",
    phase: "Starting import…",
    processed: 0,
    total: 0,
    startedAt,
    sources,
  };

  await admin.from("map_plugins").upsert(
    {
      map_id: mapId,
      plugin_type_id: PLUGIN_TYPE_ID,
      enabled: true,
      config: { ...cfg, importJob },
      status: "connected",
      updated_at: startedAt,
    },
    { onConflict: "map_id,plugin_type_id" },
  );

  const work = runImportJob(admin, mapId, sources, jobId);
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
    EdgeRuntime.waitUntil(work);
  } else {
    void work;
  }

  return json(202, {
    started: true,
    jobId,
    importJob,
  });
}

async function handleSyncStatus(
  admin: ReturnType<typeof createClient>,
  userId: string,
  mapId: string,
) {
  const { data: mp } = await admin
    .from("map_plugins")
    .select("config")
    .eq("map_id", mapId)
    .eq("plugin_type_id", PLUGIN_TYPE_ID)
    .maybeSingle();

  const cfg = (mp?.config ?? {}) as MapPluginConfig;
  const userData = await loadUserPolarstepsData(admin, userId);

  return json(200, {
    lastSyncAt: cfg.lastSyncAt,
    lastSyncSummary: cfg.lastSyncSummary,
    importJob: cfg.importJob,
    importedTripIds: cfg.importedTripIds,
    trips: listCachedTrips(userData),
  });
}

type Body =
  | { action: "list_trips" }
  | { action: "preview_trip"; shareUrl: string }
  | {
      action: "import";
      mapId: string;
      sources: ImportSource[];
    }
  | { action: "sync_status"; mapId: string };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors() });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json(400, { error: "bad_json" });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json(401, { error: "unauthorized" });

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser(jwt);
  if (userErr || !userData.user) return json(401, { error: "invalid_session" });

  const userId = userData.user.id;
  const admin = createClient(supabaseUrl, serviceKey);

  if (body.action === "list_trips") {
    return handleListTrips(admin, userId);
  }

  if (body.action === "preview_trip") {
    if (typeof body.shareUrl !== "string" || !body.shareUrl.trim()) {
      return json(400, { error: "missing_share_url" });
    }
    return handlePreviewTrip(admin, userId, body.shareUrl.trim());
  }

  if (body.action === "sync_status") {
    if (!(await assertMapMember(admin, userId, body.mapId))) {
      return json(403, { error: "forbidden" });
    }
    return handleSyncStatus(admin, userId, body.mapId);
  }

  if (body.action === "import") {
    if (!(await assertMapMember(admin, userId, body.mapId))) {
      return json(403, { error: "forbidden" });
    }
    return handleImport(admin, body.mapId, body.sources);
  }

  return json(400, { error: "unknown_action" });
});
