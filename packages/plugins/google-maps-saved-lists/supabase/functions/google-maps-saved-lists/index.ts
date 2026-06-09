import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  countPlacesNeedingCoords,
  countUniqueUrlsNeedingCoords,
  resolveMissingCoordsInCacheBatch,
  type CoordResolverConfig,
} from "./lib/_services/geocoding/resolver.ts";
import {
  DATA_PORTABILITY_MAX_POLL_MS,
  runPortabilityExport,
  type DataPortabilityResource,
} from "./lib/dataportability.ts";
import {
  importPlacesToMap,
  loadCachedExport,
  loadUserExportPluginData,
  mergeCachedExport,
  mergeImportedListIds,
  parseExportBundle,
  patchUserExportPluginData,
  placesForSource,
  PLUGIN_TYPE_ID,
  saveCachedExport,
  type CachedExportData,
  type ImportSource,
  type ImportSummary,
} from "./lib/import-places.ts";
import {
  LIST_DISCOVERY_EXPORT_COMPLETE_PROGRESS,
  listDiscoveryCoordProgress,
  listDiscoveryExportProgress,
} from "./lib/list-discovery-progress.ts";

const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";

function coordResolverConfig(): CoordResolverConfig {
  const placesKey = (Deno.env.get("GOOGLE_PLACES_API_KEY") ?? "").trim();
  const mapsKey = (Deno.env.get("GOOGLE_MAPS_API_KEY") ?? "").trim();
  return {
    placesLookupApiKey: placesKey || mapsKey || undefined,
    forwardGeocodeApiKey:
      (Deno.env.get("GEOAPIFY_API_KEY") ?? "").trim() || undefined,
  };
}

function hasCoordResolverKeys(config: CoordResolverConfig): boolean {
  return Boolean(config.placesLookupApiKey || config.forwardGeocodeApiKey);
}

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

async function importAesKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

function getEncryptionKey(): Uint8Array {
  let b64 = (Deno.env.get("PLUGIN_OAUTH_ENCRYPTION_KEY") ?? "").trim();
  if (!b64) throw new Error("PLUGIN_OAUTH_ENCRYPTION_KEY is not set");
  b64 = b64.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  if (pad) b64 += "=".repeat(4 - pad);
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  if (bin.length !== 32) {
    throw new Error("PLUGIN_OAUTH_ENCRYPTION_KEY must decode to 32 bytes");
  }
  return bin;
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function parseBytea(val: unknown): Uint8Array {
  if (val instanceof Uint8Array) return val;
  if (typeof val === "string") {
    const s = val.trim();
    if (s.startsWith("\\x")) return hexToBytes(s.slice(2));
    if (/^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0) return hexToBytes(s);
    let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    const p = b64.length % 4;
    if (p) b64 += "=".repeat(4 - p);
    const bin = atob(b64);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  }
  throw new Error("unsupported bytea format");
}

async function decryptSecret(ct: Uint8Array): Promise<string> {
  const iv = ct.slice(0, 12);
  const data = ct.slice(12);
  const key = await importAesKey(getEncryptionKey());
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(pt);
}

function byteaInsertValue(buf: Uint8Array): string {
  let hex = "";
  for (let i = 0; i < buf.length; i++) {
    hex += buf[i]!.toString(16).padStart(2, "0");
  }
  return "\\x" + hex;
}

type GoogleTokenResult =
  | { ok: true; accessToken: string }
  | { ok: false; reason: "not_linked" | "decrypt_failed" | "refresh_failed" };

async function getGoogleAccessToken(
  admin: ReturnType<typeof createClient>,
  userId: string,
  googleClientId: string,
  googleClientSecret: string,
): Promise<GoogleTokenResult> {
  const { data: row, error } = await admin
    .from("user_plugin_oauth_tokens")
    .select(
      "refresh_token_ciphertext, access_token_ciphertext, access_token_expires_at",
    )
    .eq("user_id", userId)
    .eq("plugin_type_id", PLUGIN_TYPE_ID)
    .maybeSingle();

  if (error || !row) return { ok: false, reason: "not_linked" };

  const r = row as {
    refresh_token_ciphertext: unknown;
    access_token_ciphertext: unknown | null;
    access_token_expires_at: string | null;
  };

  let refreshPlain: string;
  try {
    refreshPlain = await decryptSecret(parseBytea(r.refresh_token_ciphertext));
  } catch {
    return { ok: false, reason: "decrypt_failed" };
  }

  const exp = r.access_token_expires_at
    ? new Date(r.access_token_expires_at)
    : null;
  if (exp && exp > new Date(Date.now() + 60_000) && r.access_token_ciphertext) {
    try {
      const at = await decryptSecret(parseBytea(r.access_token_ciphertext));
      return { ok: true, accessToken: at };
    } catch {
      /* refresh */
    }
  }

  const body = new URLSearchParams({
    client_id: googleClientId,
    client_secret: googleClientSecret,
    refresh_token: refreshPlain,
    grant_type: "refresh_token",
  });

  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const tok = (await res.json()) as Record<string, unknown>;
  if (!res.ok || typeof tok.access_token !== "string") {
    return { ok: false, reason: "refresh_failed" };
  }

  const expiresIn = Number(tok.expires_in ?? 3600);
  const accessExpires = new Date(Date.now() + expiresIn * 1000).toISOString();
  const keyRaw = getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await importAesKey(keyRaw);
  const encAt = new TextEncoder().encode(tok.access_token);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encAt),
  );
  const accessCt = new Uint8Array(iv.length + ct.length);
  accessCt.set(iv, 0);
  accessCt.set(ct, iv.length);

  await admin
    .from("user_plugin_oauth_tokens")
    .update({
      access_token_ciphertext: byteaInsertValue(accessCt),
      access_token_expires_at: accessExpires,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("plugin_type_id", PLUGIN_TYPE_ID);

  return { ok: true, accessToken: tok.access_token };
}

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

type MapPluginConfig = {
  lastSyncAt?: string;
  lastSyncSummary?: Record<string, unknown>;
  importJob?: ImportJob;
  importedListIds?: string[];
};

type ListDiscoveryJobStatus =
  | "pending"
  | "exporting_starred"
  | "exporting_collections"
  | "resolving_coords"
  | "completed"
  | "failed";

type ListDiscoveryJob = {
  id: string;
  status: ListDiscoveryJobStatus;
  phase?: string;
  step: number;
  totalSteps: number;
  progress: number;
  error?: string;
  startedAt: string;
  finishedAt?: string;
  lastProgressAt?: string;
  coordUrlsTotal?: number;
  coordUrlsDone?: number;
};

type ImportJobStatus =
  | "pending"
  | "exporting"
  | "importing"
  | "completed"
  | "failed";

type ImportJob = {
  id: string;
  status: ImportJobStatus;
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

function isImportJobActive(job: ImportJob | undefined | null): boolean {
  return (
    job?.status === "pending" ||
    job?.status === "exporting" ||
    job?.status === "importing"
  );
}

function isListDiscoveryActive(
  job: ListDiscoveryJob | undefined | null,
): boolean {
  return (
    job?.status === "pending" ||
    job?.status === "exporting_starred" ||
    job?.status === "exporting_collections" ||
    job?.status === "resolving_coords"
  );
}

function parseListDiscoveryJob(
  raw: Record<string, unknown> | undefined,
): ListDiscoveryJob | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const status = raw.status;
  if (
    status !== "pending" &&
    status !== "exporting_starred" &&
    status !== "exporting_collections" &&
    status !== "resolving_coords" &&
    status !== "completed" &&
    status !== "failed"
  ) {
    return undefined;
  }
  if (typeof raw.id !== "string" || typeof raw.startedAt !== "string") {
    return undefined;
  }
  return {
    id: raw.id,
    status,
    phase: typeof raw.phase === "string" ? raw.phase : undefined,
    step: Number(raw.step ?? 0),
    totalSteps: Number(raw.totalSteps ?? 2),
    progress: Number(raw.progress ?? 0),
    error: typeof raw.error === "string" ? raw.error : undefined,
    startedAt: raw.startedAt,
    finishedAt: typeof raw.finishedAt === "string" ? raw.finishedAt : undefined,
    lastProgressAt:
      typeof raw.lastProgressAt === "string" ? raw.lastProgressAt : undefined,
    coordUrlsTotal:
      typeof raw.coordUrlsTotal === "number" ? raw.coordUrlsTotal : undefined,
    coordUrlsDone:
      typeof raw.coordUrlsDone === "number" ? raw.coordUrlsDone : undefined,
  };
}

function hasDiscoveryCache(cache: CachedExportData | null): boolean {
  return Boolean(cache?.starred || cache?.collections);
}

function countExportLists(cache: CachedExportData | null): number {
  if (!cache) return 0;
  let count = 0;
  if ((cache.starred?.places.length ?? 0) > 0) count += 1;
  count += cache.collections?.items.length ?? 0;
  return count;
}

function buildListSourcesPayload(
  cache: CachedExportData | null,
  userData: Awaited<ReturnType<typeof loadUserExportPluginData>>,
  listDiscoveryJob?: ListDiscoveryJob,
) {
  const job =
    listDiscoveryJob ??
    parseListDiscoveryJob(
      userData.listDiscoveryJob as Record<string, unknown> | undefined,
    );
  return {
    starred: (cache?.starred?.places.length ?? 0) > 0,
    starredCount: cache?.starred?.places.length ?? 0,
    collections: cache?.collections?.items ?? [],
    lastExportAt: userData.lastExportAt,
    accessType: userData.accessType,
    hasExportCache: hasDiscoveryCache(cache),
    listCount: countExportLists(cache),
    listDiscoveryJob: job,
  };
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

async function patchImportJob(
  admin: ReturnType<typeof createClient>,
  mapId: string,
  jobId: string,
  patch: Partial<ImportJob>,
): Promise<void> {
  const cfg = await readMapPluginConfig(admin, mapId);
  const current = cfg.importJob;
  if (!current || current.id !== jobId) return;

  const nextJob: ImportJob = { ...current, ...patch };
  const now = new Date().toISOString();
  await admin.from("map_plugins").upsert(
    {
      map_id: mapId,
      plugin_type_id: PLUGIN_TYPE_ID,
      enabled: true,
      config: { ...cfg, importJob: nextJob },
      status: "connected",
      updated_at: now,
    },
    { onConflict: "map_id,plugin_type_id" },
  );
}

function mergeImportSummaries(
  a: ImportSummary,
  b: ImportSummary,
): ImportSummary {
  return {
    added: a.added + b.added,
    tagged: a.tagged + b.tagged,
    skipped: a.skipped + b.skipped,
    failed: a.failed + b.failed,
  };
}

async function runImportJob(
  admin: ReturnType<typeof createClient>,
  userId: string,
  mapId: string,
  sources: ImportSource[],
  jobId: string,
): Promise<void> {
  try {
    const cache = await loadCachedExport(admin, userId);
    if (!hasDiscoveryCache(cache)) {
      await patchImportJob(admin, mapId, jobId, {
        status: "failed",
        phase: "No downloaded data",
        error:
          "Download your Google Maps data first, then choose lists to import.",
        finishedAt: new Date().toISOString(),
      });
      return;
    }

    const totalPlaces = sources.reduce(
      (sum, source) => sum + placesForSource(cache, source).length,
      0,
    );
    if (totalPlaces === 0) {
      await patchImportJob(admin, mapId, jobId, {
        status: "failed",
        phase: "No places found",
        error: "No places found for the selected lists.",
        finishedAt: new Date().toISOString(),
      });
      return;
    }

    await patchImportJob(admin, mapId, jobId, {
      status: "importing",
      phase: "Adding pins…",
      processed: 0,
      total: totalPlaces,
      partialSummary: { added: 0, tagged: 0, skipped: 0, failed: 0 },
    });

    let aggregateBefore: ImportSummary = {
      added: 0,
      tagged: 0,
      skipped: 0,
      failed: 0,
    };
    let processedTotal = 0;

    for (const source of sources) {
      const places = placesForSource(cache, source);
      if (places.length === 0) continue;

      const label = source.type === "starred" ? "Starred places" : source.name;
      const sourceStart = processedTotal;
      await patchImportJob(admin, mapId, jobId, {
        phase: `Importing ${label}…`,
      });

      const summary = await importPlacesToMap(admin, mapId, places, source, {
        onProgress: async ({ processed, summary: partial }) => {
          await patchImportJob(admin, mapId, jobId, {
            processed: sourceStart + processed,
            partialSummary: mergeImportSummaries(aggregateBefore, partial),
          });
        },
      });

      aggregateBefore = mergeImportSummaries(aggregateBefore, summary);
      processedTotal += places.length;
      await patchImportJob(admin, mapId, jobId, {
        processed: processedTotal,
        partialSummary: aggregateBefore,
      });
    }

    const aggregate = aggregateBefore;

    const now = new Date().toISOString();
    const cfg = await readMapPluginConfig(admin, mapId);

    await admin.from("map_plugins").upsert(
      {
        map_id: mapId,
        plugin_type_id: PLUGIN_TYPE_ID,
        enabled: true,
        config: {
          ...cfg,
          lastSyncAt: now,
          lastSyncSummary: aggregate,
          importedListIds: mergeImportedListIds(cfg.importedListIds, sources),
          importJob: {
            id: jobId,
            status: "completed",
            phase: "Import complete",
            processed: totalPlaces,
            total: totalPlaces,
            summary: aggregate,
            startedAt: cfg.importJob?.startedAt ?? now,
            finishedAt: now,
            sources,
          },
        },
        status: "connected",
        updated_at: now,
      },
      { onConflict: "map_id,plugin_type_id" },
    );
  } catch (e) {
    console.error("import job failed", mapId, jobId, e);
    await patchImportJob(admin, mapId, jobId, {
      status: "failed",
      phase: "Import failed",
      error: e instanceof Error ? e.message : String(e),
      finishedAt: new Date().toISOString(),
    });
  }
}

async function patchListDiscoveryJob(
  admin: ReturnType<typeof createClient>,
  userId: string,
  jobId: string,
  patch: Partial<ListDiscoveryJob>,
): Promise<void> {
  const userData = await loadUserExportPluginData(admin, userId);
  const current = parseListDiscoveryJob(
    userData.listDiscoveryJob as Record<string, unknown> | undefined,
  );
  if (!current || current.id !== jobId) return;

  await patchUserExportPluginData(admin, userId, {
    listDiscoveryJob: { ...current, ...patch },
  });
}

type ExportProgressUpdate = {
  phase: string;
  step: number;
  totalSteps: number;
  progress: number;
};

const DISCOVERY_TOTAL_STEPS = 3;
const LIST_DISCOVERY_MAX_MS = 45 * 60 * 1000;
const COORD_BATCH_MAX_URLS = 40;
const COORD_BATCH_TIME_BUDGET_MS = 90_000;
const COORD_WORKER_STALE_MS = 20_000;

function scheduleBackgroundWork(work: () => Promise<void>): void {
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
    EdgeRuntime.waitUntil(work());
  } else {
    void work();
  }
}

function coordResolutionProgress(
  urlsDone: number,
  urlsTotal: number,
): ExportProgressUpdate {
  const totalSteps = DISCOVERY_TOTAL_STEPS;
  return {
    phase: `Resolving coordinates (${urlsDone}/${urlsTotal} URLs)…`,
    step: 2,
    totalSteps,
    progress: listDiscoveryCoordProgress(urlsDone, urlsTotal),
  };
}

async function runCoordResolutionBatch(
  admin: ReturnType<typeof createClient>,
  userId: string,
  jobId: string,
): Promise<void> {
  const userData = await loadUserExportPluginData(admin, userId);
  const job = parseListDiscoveryJob(
    userData.listDiscoveryJob as Record<string, unknown> | undefined,
  );
  if (!job || job.id !== jobId || job.status !== "resolving_coords") return;

  let cache = (await loadCachedExport(admin, userId)) ?? {};
  const pendingUrls = countUniqueUrlsNeedingCoords(cache);
  if (pendingUrls === 0) {
    await patchListDiscoveryJob(admin, userId, jobId, {
      status: "completed",
      phase: "Download complete",
      step: DISCOVERY_TOTAL_STEPS,
      totalSteps: DISCOVERY_TOTAL_STEPS,
      progress: 100,
      finishedAt: new Date().toISOString(),
      lastProgressAt: new Date().toISOString(),
    });
    return;
  }

  const resolverConfig = coordResolverConfig();
  if (!hasCoordResolverKeys(resolverConfig)) {
    await patchListDiscoveryJob(admin, userId, jobId, {
      status: "failed",
      phase: "Coordinate lookup not configured",
      error:
        "Set GOOGLE_PLACES_API_KEY (or GOOGLE_MAPS_API_KEY) and/or GEOAPIFY_API_KEY on the google-maps-saved-lists Edge Function, then retry download.",
      finishedAt: new Date().toISOString(),
      lastProgressAt: new Date().toISOString(),
    });
    return;
  }

  const urlsTotal = job.coordUrlsTotal ?? pendingUrls;
  const urlsDoneOffset =
    job.coordUrlsDone ?? Math.max(0, urlsTotal - pendingUrls);

  await patchListDiscoveryJob(admin, userId, jobId, {
    status: "resolving_coords",
    step: 2,
    totalSteps: DISCOVERY_TOTAL_STEPS,
    coordUrlsTotal: urlsTotal,
    coordUrlsDone: urlsDoneOffset,
    lastProgressAt: new Date().toISOString(),
    ...coordResolutionProgress(urlsDoneOffset, urlsTotal),
  });

  const result = await resolveMissingCoordsInCacheBatch(cache, {
    maxUrls: COORD_BATCH_MAX_URLS,
    timeBudgetMs: COORD_BATCH_TIME_BUDGET_MS,
    urlsTotal,
    urlsDoneOffset,
    resolverConfig,
    onProgress: async (update) => {
      await patchListDiscoveryJob(admin, userId, jobId, {
        status: "resolving_coords",
        phase: update.phase,
        step: 2,
        totalSteps: DISCOVERY_TOTAL_STEPS,
        coordUrlsTotal: update.total,
        coordUrlsDone: update.done,
        lastProgressAt: new Date().toISOString(),
        progress: listDiscoveryCoordProgress(update.done, update.total),
      });
    },
  });

  cache = result.cache;
  await saveCachedExport(admin, userId, cache);

  const placesKeyIssue = result.placesLookupKeyIssue;
  if (placesKeyIssue && result.placesResolved === 0) {
    await patchListDiscoveryJob(admin, userId, jobId, {
      status: "failed",
      phase: "Google Places API key misconfigured",
      error: placesKeyIssue,
      finishedAt: new Date().toISOString(),
      lastProgressAt: new Date().toISOString(),
    });
    return;
  }

  if (result.complete) {
    await patchListDiscoveryJob(admin, userId, jobId, {
      status: "completed",
      phase: "Download complete",
      step: DISCOVERY_TOTAL_STEPS,
      totalSteps: DISCOVERY_TOTAL_STEPS,
      progress: 100,
      coordUrlsTotal: result.urlsTotal,
      coordUrlsDone: result.urlsTotal,
      finishedAt: new Date().toISOString(),
      lastProgressAt: new Date().toISOString(),
    });
    return;
  }

  await patchListDiscoveryJob(admin, userId, jobId, {
    status: "resolving_coords",
    coordUrlsTotal: result.urlsTotal,
    coordUrlsDone: result.urlsDone,
    lastProgressAt: new Date().toISOString(),
    ...coordResolutionProgress(result.urlsDone, result.urlsTotal),
  });

  scheduleBackgroundWork(() => runCoordResolutionBatch(admin, userId, jobId));
}

function maybeResumeCoordResolution(
  admin: ReturnType<typeof createClient>,
  userId: string,
  job: ListDiscoveryJob | undefined,
): void {
  if (!job || job.status !== "resolving_coords") return;

  const heartbeatMs = job.lastProgressAt
    ? new Date(job.lastProgressAt).getTime()
    : new Date(job.startedAt).getTime();
  if (Number.isNaN(heartbeatMs)) return;
  if (Date.now() - heartbeatMs < COORD_WORKER_STALE_MS) return;

  scheduleBackgroundWork(() => runCoordResolutionBatch(admin, userId, job.id));
}

function discoveryStatusForStep(step: number): ListDiscoveryJobStatus {
  if (step >= 2) return "resolving_coords";
  if (step === 1) return "exporting_collections";
  return "exporting_starred";
}

function isListDiscoveryJobTimedOut(job: ListDiscoveryJob): boolean {
  if (!isListDiscoveryActive(job)) return false;
  const started = new Date(job.startedAt).getTime();
  if (Number.isNaN(started)) return false;
  return Date.now() - started > LIST_DISCOVERY_MAX_MS;
}

async function reconcileListDiscoveryJob(
  admin: ReturnType<typeof createClient>,
  userId: string,
  job: ListDiscoveryJob | undefined,
): Promise<ListDiscoveryJob | undefined> {
  if (!job || !isListDiscoveryJobTimedOut(job)) return job;

  const failed: ListDiscoveryJob = {
    ...job,
    status: "failed",
    phase: "Download timed out",
    error:
      "Google Maps download took too long and was stopped. Open the wizard and try again.",
    finishedAt: new Date().toISOString(),
  };
  await patchUserExportPluginData(admin, userId, { listDiscoveryJob: failed });
  return failed;
}

async function refreshExportsIfNeeded(
  admin: ReturnType<typeof createClient>,
  userId: string,
  accessToken: string,
  force: boolean,
  onProgress?: (update: ExportProgressUpdate) => Promise<void>,
): Promise<CachedExportData> {
  let cache = (await loadCachedExport(admin, userId)) ?? {};
  const userData = await loadUserExportPluginData(admin, userId);

  const resources: DataPortabilityResource[] = [
    "maps.starred_places",
    "saved.collections",
  ];

  let latestExportAt = userData.lastExportAt;
  let latestAccessType = userData.accessType;
  const totalSteps = DISCOVERY_TOTAL_STEPS;

  for (let index = 0; index < resources.length; index++) {
    const resource = resources[index]!;
    const sectionKey =
      resource === "maps.starred_places" ? "starred" : "collections";
    const hasData =
      sectionKey === "starred"
        ? (cache.starred?.places.length ?? 0) > 0
        : (cache.collections?.items.length ?? 0) > 0;

    if (!force && hasData) {
      continue;
    }

    const label =
      resource === "maps.starred_places" ? "starred places" : "saved lists";

    await onProgress?.({
      phase: `Requesting ${label} from Google…`,
      step: index,
      totalSteps,
      progress: listDiscoveryExportProgress(index as 0 | 1, 0),
    });

    const bundle = await runPortabilityExport(accessToken, resource, {
      onPoll: async (state, elapsedMs) => {
        const pollRatio = Math.min(1, elapsedMs / DATA_PORTABILITY_MAX_POLL_MS);
        const waiting = !state.includes("COMPLETE");
        await onProgress?.({
          phase: waiting
            ? `Waiting for Google (${label})…`
            : `Downloading ${label}…`,
          step: index,
          totalSteps,
          progress: listDiscoveryExportProgress(
            index as 0 | 1,
            pollRatio * 0.92,
          ),
        });
      },
    });

    await onProgress?.({
      phase: `Processing ${label}…`,
      step: index,
      totalSteps,
      progress: listDiscoveryExportProgress(index as 0 | 1, 0.96),
    });

    cache = mergeCachedExport(cache, parseExportBundle(bundle));
    latestExportAt = bundle.exportedAt;
    if (bundle.accessType !== "ACCESS_TYPE_UNSPECIFIED") {
      latestAccessType = bundle.accessType;
    }

    if (cache.starred || cache.collections) {
      await saveCachedExport(admin, userId, cache);
    }
  }

  if (latestExportAt) {
    await patchUserExportPluginData(admin, userId, {
      lastExportAt: latestExportAt,
      accessType: latestAccessType,
    });
  }

  const needingCoords = countPlacesNeedingCoords(cache);
  if (needingCoords > 0) {
    const urlsTotal = countUniqueUrlsNeedingCoords(cache);
    await onProgress?.({
      phase: `Resolving coordinates (0/${urlsTotal} URLs)…`,
      step: 2,
      totalSteps,
      progress: LIST_DISCOVERY_EXPORT_COMPLETE_PROGRESS,
    });
  }

  return cache;
}

async function beginCoordResolution(
  admin: ReturnType<typeof createClient>,
  userId: string,
  jobId: string,
): Promise<void> {
  const cache = (await loadCachedExport(admin, userId)) ?? {};
  const urlsTotal = countUniqueUrlsNeedingCoords(cache);
  if (urlsTotal === 0) {
    await patchListDiscoveryJob(admin, userId, jobId, {
      status: "completed",
      phase: "Download complete",
      step: DISCOVERY_TOTAL_STEPS,
      totalSteps: DISCOVERY_TOTAL_STEPS,
      progress: 100,
      finishedAt: new Date().toISOString(),
      lastProgressAt: new Date().toISOString(),
    });
    return;
  }

  await patchListDiscoveryJob(admin, userId, jobId, {
    status: "resolving_coords",
    step: 2,
    totalSteps: DISCOVERY_TOTAL_STEPS,
    coordUrlsTotal: urlsTotal,
    coordUrlsDone: 0,
    lastProgressAt: new Date().toISOString(),
    ...coordResolutionProgress(0, urlsTotal),
  });

  await runCoordResolutionBatch(admin, userId, jobId);
}

async function runListDiscoveryJob(
  admin: ReturnType<typeof createClient>,
  userId: string,
  accessToken: string,
  jobId: string,
): Promise<void> {
  try {
    await patchListDiscoveryJob(admin, userId, jobId, {
      status: "pending",
      phase: "Connecting to Google…",
      step: 0,
      totalSteps: DISCOVERY_TOTAL_STEPS,
      progress: 4,
    });

    await refreshExportsIfNeeded(
      admin,
      userId,
      accessToken,
      true,
      async (update) => {
        await patchListDiscoveryJob(admin, userId, jobId, {
          status: discoveryStatusForStep(update.step),
          phase: update.phase,
          step: update.step,
          totalSteps: update.totalSteps,
          progress: update.progress,
          lastProgressAt: new Date().toISOString(),
        });
      },
    );

    await beginCoordResolution(admin, userId, jobId);
  } catch (e) {
    console.error("list discovery failed", userId, jobId, e);
    const message = e instanceof Error ? e.message : String(e);
    await patchListDiscoveryJob(admin, userId, jobId, {
      status: "failed",
      phase: "Download failed",
      error: message || "Could not download from Google. Try again.",
      finishedAt: new Date().toISOString(),
    });
  }
}

async function handleListSources(
  admin: ReturnType<typeof createClient>,
  userId: string,
) {
  const cache = (await loadCachedExport(admin, userId)) ?? {};
  const userData = await loadUserExportPluginData(admin, userId);
  const listDiscoveryJob = await reconcileListDiscoveryJob(
    admin,
    userId,
    parseListDiscoveryJob(
      userData.listDiscoveryJob as Record<string, unknown> | undefined,
    ),
  );
  maybeResumeCoordResolution(admin, userId, listDiscoveryJob);
  return json(200, buildListSourcesPayload(cache, userData, listDiscoveryJob));
}

async function handleStartDownload(
  admin: ReturnType<typeof createClient>,
  userId: string,
  accessToken: string,
) {
  const cache = (await loadCachedExport(admin, userId)) ?? {};
  const userData = await loadUserExportPluginData(admin, userId);
  const activeJob = parseListDiscoveryJob(
    userData.listDiscoveryJob as Record<string, unknown> | undefined,
  );

  if (activeJob && isListDiscoveryActive(activeJob)) {
    maybeResumeCoordResolution(admin, userId, activeJob);
    return json(200, {
      started: false,
      ...buildListSourcesPayload(cache, userData, activeJob),
    });
  }

  const jobId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const listDiscoveryJob: ListDiscoveryJob = {
    id: jobId,
    status: "pending",
    phase: "Connecting to Google…",
    step: 0,
    totalSteps: DISCOVERY_TOTAL_STEPS,
    progress: 0,
    startedAt,
  };

  await patchUserExportPluginData(admin, userId, { listDiscoveryJob });

  const work = runListDiscoveryJob(admin, userId, accessToken, jobId);
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
    EdgeRuntime.waitUntil(work);
  } else {
    void work;
  }

  return json(202, {
    started: true,
    ...buildListSourcesPayload(cache, userData, listDiscoveryJob),
  });
}

async function handleImport(
  admin: ReturnType<typeof createClient>,
  userId: string,
  mapId: string,
  sources: ImportSource[],
) {
  if (!sources.length) {
    return json(400, {
      error: "no_sources",
      message: "Choose at least one list to import.",
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

  const work = runImportJob(admin, userId, mapId, sources, jobId);
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
  const { data: tokenRow } = await admin
    .from("user_plugin_oauth_tokens")
    .select("user_id")
    .eq("user_id", userId)
    .eq("plugin_type_id", PLUGIN_TYPE_ID)
    .maybeSingle();

  const { data: mp } = await admin
    .from("map_plugins")
    .select("config")
    .eq("map_id", mapId)
    .eq("plugin_type_id", PLUGIN_TYPE_ID)
    .maybeSingle();

  const cfg = (mp?.config ?? {}) as MapPluginConfig;
  const cache = (await loadCachedExport(admin, userId)) ?? {};
  const userData = await loadUserExportPluginData(admin, userId);
  const listDiscoveryJob = await reconcileListDiscoveryJob(
    admin,
    userId,
    parseListDiscoveryJob(
      userData.listDiscoveryJob as Record<string, unknown> | undefined,
    ),
  );
  maybeResumeCoordResolution(admin, userId, listDiscoveryJob);

  return json(200, {
    linked: Boolean(tokenRow),
    hasExportCache: hasDiscoveryCache(cache),
    listCount: countExportLists(cache),
    lastExportAt: userData.lastExportAt,
    accessType: userData.accessType,
    listDiscoveryJob,
    lastSyncAt: cfg.lastSyncAt,
    lastSyncSummary: cfg.lastSyncSummary,
    importJob: cfg.importJob,
    importedListIds: cfg.importedListIds,
  });
}

type Body =
  | { action: "list_sources" }
  | { action: "start_download" }
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
  const googleClientId =
    Deno.env.get("GOOGLE_DATAPORTABILITY_CLIENT_ID") ??
    Deno.env.get("GOOGLE_CLIENT_ID") ??
    "";
  const googleClientSecret =
    Deno.env.get("GOOGLE_DATAPORTABILITY_CLIENT_SECRET") ??
    Deno.env.get("GOOGLE_CLIENT_SECRET") ??
    "";

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

  if (body.action === "sync_status") {
    if (!(await assertMapMember(admin, userId, body.mapId))) {
      return json(403, { error: "forbidden" });
    }
    return handleSyncStatus(admin, userId, body.mapId);
  }

  const gt = await getGoogleAccessToken(
    admin,
    userId,
    googleClientId,
    googleClientSecret,
  );
  if (!gt.ok) {
    const messages: Record<string, string> = {
      not_linked: "Link Google Maps under Plugins first.",
      decrypt_failed:
        "Stored tokens could not be decrypted. Unlink and link again.",
      refresh_failed:
        "Google rejected the refresh token. Unlink and link again.",
    };
    return json(gt.reason === "not_linked" ? 401 : 502, {
      error: gt.reason,
      message: messages[gt.reason],
    });
  }

  if (body.action === "list_sources") {
    return handleListSources(admin, userId);
  }

  if (body.action === "start_download") {
    return handleStartDownload(admin, userId, gt.accessToken);
  }

  if (body.action === "import") {
    if (!(await assertMapMember(admin, userId, body.mapId))) {
      return json(403, { error: "forbidden" });
    }
    return handleImport(admin, userId, body.mapId, body.sources);
  }

  return json(400, { error: "unknown_action" });
});
