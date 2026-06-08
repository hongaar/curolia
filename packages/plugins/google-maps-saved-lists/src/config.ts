import { googleMapsSavedListsPluginMeta } from "./plugin-meta";

export const GOOGLE_MAPS_SAVED_LISTS_PLUGIN_ID =
  googleMapsSavedListsPluginMeta.typeId;

export type GoogleMapsSavedListSource =
  | { type: "starred" }
  | { type: "collection"; name: string };

export type GoogleMapsSavedListsSyncSummary = {
  added: number;
  tagged?: number;
  skipped: number;
  failed: number;
  removedFromSource?: number;
};

export type GoogleMapsImportJobStatus =
  | "pending"
  | "exporting"
  | "importing"
  | "completed"
  | "failed";

export type GoogleMapsImportJob = {
  id: string;
  status: GoogleMapsImportJobStatus;
  phase?: string;
  processed: number;
  total: number;
  partialSummary?: GoogleMapsSavedListsSyncSummary;
  summary?: GoogleMapsSavedListsSyncSummary;
  error?: string;
  startedAt: string;
  finishedAt?: string;
  sources: GoogleMapsSavedListSource[];
};

export type GoogleMapsListDiscoveryJobStatus =
  | "pending"
  | "exporting_starred"
  | "exporting_collections"
  | "resolving_coords"
  | "completed"
  | "failed";

export type GoogleMapsListDiscoveryJob = {
  id: string;
  status: GoogleMapsListDiscoveryJobStatus;
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

export type GoogleMapsSavedListsMapConfig = {
  lastSyncAt?: string;
  lastSyncSummary?: GoogleMapsSavedListsSyncSummary;
  importJob?: GoogleMapsImportJob;
  /** Checklist ids (`starred` or collection name) already imported to this map. */
  importedListIds?: string[];
};

export type GoogleMapsSavedListsMapPluginRow = {
  enabled?: boolean;
  config?: GoogleMapsSavedListsMapConfig;
};

function parseSources(raw: unknown): GoogleMapsSavedListSource[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const sources: GoogleMapsSavedListSource[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const s = item as Record<string, unknown>;
    if (s.type === "starred") {
      sources.push({ type: "starred" });
    } else if (s.type === "collection" && typeof s.name === "string") {
      sources.push({ type: "collection", name: s.name });
    }
  }
  return sources.length > 0 ? sources : undefined;
}

function parseSingleSource(
  raw: unknown,
): GoogleMapsSavedListSource | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const s = raw as Record<string, unknown>;
  if (s.type === "starred") return { type: "starred" };
  if (s.type === "collection" && typeof s.name === "string") {
    return { type: "collection", name: s.name };
  }
  return undefined;
}

function parseSyncSummary(
  raw: unknown,
): GoogleMapsSavedListsSyncSummary | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const sm = raw as Record<string, unknown>;
  return {
    added: Number(sm.added ?? 0),
    tagged: typeof sm.tagged === "number" ? sm.tagged : undefined,
    skipped: Number(sm.skipped ?? 0),
    failed: Number(sm.failed ?? 0),
    removedFromSource:
      typeof sm.removedFromSource === "number"
        ? sm.removedFromSource
        : undefined,
  };
}

function parseImportJob(raw: unknown): GoogleMapsImportJob | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const job = raw as Record<string, unknown>;
  const status = job.status;
  if (
    status !== "pending" &&
    status !== "exporting" &&
    status !== "importing" &&
    status !== "completed" &&
    status !== "failed"
  ) {
    return undefined;
  }
  if (typeof job.id !== "string" || typeof job.startedAt !== "string") {
    return undefined;
  }

  const sources =
    parseSources(job.sources) ??
    (() => {
      const single = parseSingleSource(job.source);
      return single ? [single] : undefined;
    })();
  if (!sources) return undefined;

  return {
    id: job.id,
    status,
    phase: typeof job.phase === "string" ? job.phase : undefined,
    processed: Number(job.processed ?? 0),
    total: Number(job.total ?? 0),
    partialSummary: parseSyncSummary(job.partialSummary),
    summary: parseSyncSummary(job.summary),
    error: typeof job.error === "string" ? job.error : undefined,
    startedAt: job.startedAt,
    finishedAt: typeof job.finishedAt === "string" ? job.finishedAt : undefined,
    sources,
  };
}

export function parseGoogleMapsListDiscoveryJob(
  raw: unknown,
): GoogleMapsListDiscoveryJob | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const job = raw as Record<string, unknown>;
  const status = job.status;
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
  if (typeof job.id !== "string" || typeof job.startedAt !== "string") {
    return undefined;
  }
  return {
    id: job.id,
    status,
    phase: typeof job.phase === "string" ? job.phase : undefined,
    step: Number(job.step ?? 0),
    totalSteps: Number(job.totalSteps ?? 2),
    progress: Number(job.progress ?? 0),
    error: typeof job.error === "string" ? job.error : undefined,
    startedAt: job.startedAt,
    finishedAt: typeof job.finishedAt === "string" ? job.finishedAt : undefined,
  };
}

export function parseGoogleMapsSavedListsMapConfig(
  raw: Record<string, unknown> | undefined | null,
): GoogleMapsSavedListsMapConfig {
  if (!raw || typeof raw !== "object") return {};
  const out: GoogleMapsSavedListsMapConfig = {};

  if (typeof raw.lastSyncAt === "string") out.lastSyncAt = raw.lastSyncAt;

  const summary = parseSyncSummary(raw.lastSyncSummary);
  if (summary) out.lastSyncSummary = summary;

  const importJob = parseImportJob(raw.importJob);
  if (importJob) out.importJob = importJob;

  if (Array.isArray(raw.importedListIds)) {
    const ids = raw.importedListIds.filter(
      (id): id is string => typeof id === "string" && id.length > 0,
    );
    if (ids.length > 0) out.importedListIds = [...new Set(ids)];
  }

  return out;
}

export function isGoogleMapsSavedListsEnabledForMap(
  jp: GoogleMapsSavedListsMapPluginRow | undefined | null,
): boolean {
  return jp?.enabled === true;
}

export function isOneTimeDataPortabilityAccess(
  accessType: string | undefined,
): boolean {
  return accessType === "ACCESS_TYPE_ONE_TIME";
}

export function isGoogleMapsImportActive(
  job: GoogleMapsImportJob | undefined | null,
): boolean {
  return (
    job?.status === "pending" ||
    job?.status === "exporting" ||
    job?.status === "importing"
  );
}

export function isGoogleMapsListDiscoveryActive(
  job: GoogleMapsListDiscoveryJob | undefined | null,
): boolean {
  return (
    job?.status === "pending" ||
    job?.status === "exporting_starred" ||
    job?.status === "exporting_collections" ||
    job?.status === "resolving_coords"
  );
}

export function mergeGoogleMapsSavedListsConfig(
  current: Record<string, unknown>,
  patch: Partial<GoogleMapsSavedListsMapConfig>,
): Record<string, unknown> {
  return { ...current, ...patch };
}
