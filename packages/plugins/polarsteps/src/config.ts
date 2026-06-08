import { polarstepsPluginMeta } from "./plugin-meta";

export const POLARSTEPS_PLUGIN_ID = polarstepsPluginMeta.typeId;

export type PolarstepsImportSource = {
  type: "share_url";
  shareUrl: string;
};

export type PolarstepsSyncSummary = {
  added: number;
  tagged?: number;
  skipped: number;
  failed: number;
  photosImported?: number;
  photosFailed?: number;
};

export type PolarstepsImportJobStatus =
  | "pending"
  | "fetching"
  | "importing"
  | "completed"
  | "failed";

export type PolarstepsImportJob = {
  id: string;
  status: PolarstepsImportJobStatus;
  phase?: string;
  processed: number;
  total: number;
  partialSummary?: PolarstepsSyncSummary;
  summary?: PolarstepsSyncSummary;
  error?: string;
  startedAt: string;
  finishedAt?: string;
  sources: PolarstepsImportSource[];
};

export type PolarstepsTripPreview = {
  tripId: string;
  shareUrl: string;
  title: string;
  stepCount: number;
  photoCount?: number;
  startDate?: string;
  endDate?: string;
  addedAt: string;
};

export type PolarstepsMapConfig = {
  lastSyncAt?: string;
  lastSyncSummary?: PolarstepsSyncSummary;
  importJob?: PolarstepsImportJob;
  /** Trip ids already imported to this map. */
  importedTripIds?: string[];
};

export type PolarstepsMapPluginRow = {
  enabled?: boolean;
  config?: PolarstepsMapConfig;
};

function parseSources(raw: unknown): PolarstepsImportSource[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const sources: PolarstepsImportSource[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const s = item as Record<string, unknown>;
    if (s.type === "share_url" && typeof s.shareUrl === "string") {
      sources.push({ type: "share_url", shareUrl: s.shareUrl });
    }
  }
  return sources.length > 0 ? sources : undefined;
}

function parseSyncSummary(raw: unknown): PolarstepsSyncSummary | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const sm = raw as Record<string, unknown>;
  return {
    added: Number(sm.added ?? 0),
    tagged: typeof sm.tagged === "number" ? sm.tagged : undefined,
    skipped: Number(sm.skipped ?? 0),
    failed: Number(sm.failed ?? 0),
    photosImported:
      typeof sm.photosImported === "number" ? sm.photosImported : undefined,
    photosFailed:
      typeof sm.photosFailed === "number" ? sm.photosFailed : undefined,
  };
}

function parseImportJob(raw: unknown): PolarstepsImportJob | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const job = raw as Record<string, unknown>;
  const status = job.status;
  if (
    status !== "pending" &&
    status !== "fetching" &&
    status !== "importing" &&
    status !== "completed" &&
    status !== "failed"
  ) {
    return undefined;
  }
  if (typeof job.id !== "string" || typeof job.startedAt !== "string") {
    return undefined;
  }
  const sources = parseSources(job.sources);
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

export function parsePolarstepsMapConfig(
  raw: Record<string, unknown> | undefined | null,
): PolarstepsMapConfig {
  if (!raw || typeof raw !== "object") return {};
  const out: PolarstepsMapConfig = {};

  if (typeof raw.lastSyncAt === "string") out.lastSyncAt = raw.lastSyncAt;

  const summary = parseSyncSummary(raw.lastSyncSummary);
  if (summary) out.lastSyncSummary = summary;

  const importJob = parseImportJob(raw.importJob);
  if (importJob) out.importJob = importJob;

  if (Array.isArray(raw.importedTripIds)) {
    const ids = raw.importedTripIds.filter(
      (id): id is string => typeof id === "string" && id.length > 0,
    );
    if (ids.length > 0) out.importedTripIds = [...new Set(ids)];
  }

  return out;
}

export function isPolarstepsImportActive(
  job: PolarstepsImportJob | undefined | null,
): boolean {
  return (
    job?.status === "pending" ||
    job?.status === "fetching" ||
    job?.status === "importing"
  );
}

export function mergePolarstepsConfig(
  current: Record<string, unknown>,
  patch: Partial<PolarstepsMapConfig>,
): Record<string, unknown> {
  return { ...current, ...patch };
}
