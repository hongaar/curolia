import type { TaskProgressStatus } from "@curolia/ui/task-progress";
import type {
  GoogleMapsImportJob,
  GoogleMapsListDiscoveryJob,
  GoogleMapsSavedListSource,
  GoogleMapsSavedListsSyncSummary,
} from "./config";
import {
  isGoogleMapsImportActive,
  isGoogleMapsListDiscoveryActive,
} from "./config";

export const WIZARD_STEPS = [
  { id: "intro", title: "How it works" },
  { id: "download", title: "Download data" },
  { id: "lists", title: "Choose lists" },
  { id: "import", title: "Add to map" },
] as const;

/** Matches edge `list-discovery-progress.ts` weights (5% / 5% / 5% / 85%). */
const DISCOVERY_PROGRESS = {
  starred: 0.05,
  collections: 0.05,
  mymaps: 0.05,
  coordinates: 0.85,
} as const;

function listDiscoveryCoordProgressPercent(
  urlsDone: number,
  urlsTotal: number,
): number {
  const ratio = urlsDone / Math.max(urlsTotal, 1);
  const start =
    DISCOVERY_PROGRESS.starred +
    DISCOVERY_PROGRESS.collections +
    DISCOVERY_PROGRESS.mymaps;
  return Math.round((start + DISCOVERY_PROGRESS.coordinates * ratio) * 100);
}

function listDiscoveryJobProgressPercent(
  job: GoogleMapsListDiscoveryJob | undefined,
): number | undefined {
  if (!job) return undefined;
  if (job.status === "completed") return 100;
  if (
    job.status === "resolving_coords" &&
    job.coordUrlsTotal != null &&
    job.coordUrlsTotal > 0
  ) {
    return listDiscoveryCoordProgressPercent(
      job.coordUrlsDone ?? 0,
      job.coordUrlsTotal,
    );
  }
  return job.progress;
}

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

export function formatGoogleMapsWhen(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString();
}

export function formatImportedListCount(count: number): string {
  return count === 1
    ? "1 list added to this map"
    : `${count} lists added to this map`;
}

export function formatImportSummary(summary: {
  added: number;
  tagged?: number;
  skipped: number;
  failed: number;
}): string {
  const parts = [`${summary.added} added`];
  if (summary.tagged) parts.push(`${summary.tagged} tagged`);
  parts.push(`${summary.skipped} skipped`);
  if (summary.failed) parts.push(`${summary.failed} failed`);
  return parts.join(", ");
}

export function isStaleActiveImportJob(
  importJob: GoogleMapsImportJob | undefined,
  lastSyncAt: string | undefined,
): boolean {
  return Boolean(
    importJob &&
    lastSyncAt &&
    isGoogleMapsImportActive(importJob) &&
    new Date(lastSyncAt).getTime() >= new Date(importJob.startedAt).getTime(),
  );
}

export function isImportInProgress(
  importJob: GoogleMapsImportJob | undefined,
  lastSyncAt: string | undefined,
): boolean {
  return (
    isGoogleMapsImportActive(importJob) &&
    !isStaleActiveImportJob(importJob, lastSyncAt)
  );
}

export function isRecentFailedImport(
  importJob: GoogleMapsImportJob | undefined,
  lastSyncAt: string | undefined,
): boolean {
  if (importJob?.status !== "failed") return false;
  if (!lastSyncAt) return true;
  return (
    new Date(importJob.startedAt).getTime() > new Date(lastSyncAt).getTime()
  );
}

const LIST_DISCOVERY_MAX_MS = 45 * 60 * 1000;

export function isListDiscoveryJobTimedOut(
  job: GoogleMapsListDiscoveryJob | undefined | null,
  nowMs: number = Date.now(),
): boolean {
  if (!job || !isGoogleMapsListDiscoveryActive(job)) return false;
  const started = new Date(job.startedAt).getTime();
  if (Number.isNaN(started)) return false;
  return nowMs - started > LIST_DISCOVERY_MAX_MS;
}

export function resolveInitialWizardStep(args: {
  importInProgress: boolean;
  listDiscoveryActive: boolean;
  listDiscoveryFailed: boolean;
  hasExportCache: boolean;
}): number {
  if (args.importInProgress) return 3;
  if (args.listDiscoveryActive || args.listDiscoveryFailed) return 1;
  if (args.hasExportCache) return 2;
  return 0;
}

export function resolveImportButtonLabel(args: {
  importInProgress: boolean;
  listDiscoveryActive: boolean;
  listDiscoveryFailed: boolean;
  lastSyncAt?: string;
  hasExportCache: boolean;
}): string {
  if (args.importInProgress) {
    return "Continue import";
  }
  if (args.listDiscoveryActive) {
    return "View download progress";
  }
  if (args.listDiscoveryFailed) {
    return "Try download again";
  }
  if (args.lastSyncAt) {
    return "Import more lists";
  }
  if (args.hasExportCache) {
    return "Choose lists to import";
  }
  return "Import from Google Maps";
}

export function buildMapSettingsStatus(args: {
  pluginGloballyEnabled: boolean;
  linked: boolean;
  hasExportCache: boolean;
  listCount?: number;
  lastExportAt?: string;
  listDiscoveryJob?: GoogleMapsListDiscoveryJob;
  importJob?: GoogleMapsImportJob;
  lastSyncAt?: string;
  lastSyncSummary?: GoogleMapsSavedListsSyncSummary;
  importedListCount?: number;
}): string | null {
  if (!args.pluginGloballyEnabled) {
    return "Turn on Google Maps under Plugins and link your account first.";
  }
  if (!args.linked) {
    return "Link Google Maps under Plugins to import saved places.";
  }

  if (isImportInProgress(args.importJob, args.lastSyncAt) && args.importJob) {
    const parts: string[] = [args.importJob.phase ?? "Importing…"];
    if (args.importJob.total > 0) {
      parts.push(`${args.importJob.processed}/${args.importJob.total} places`);
    }
    return parts.join(" · ");
  }

  if (
    args.listDiscoveryJob &&
    isGoogleMapsListDiscoveryActive(args.listDiscoveryJob)
  ) {
    return `Downloading Google Maps data · ${args.listDiscoveryJob.phase ?? "In progress…"}`;
  }

  if (args.listDiscoveryJob?.status === "failed") {
    return (
      args.listDiscoveryJob.error ??
      "Google Maps download failed. Open the wizard to try again."
    );
  }

  if (args.importedListCount && args.importedListCount > 0) {
    return formatImportedListCount(args.importedListCount);
  }

  if (args.hasExportCache) {
    const when = formatGoogleMapsWhen(args.lastExportAt);
    const listPart =
      args.listCount === 1
        ? "1 list"
        : args.listCount
          ? `${args.listCount} lists`
          : "lists";
    return when
      ? `Google data ready · ${listPart} · downloaded ${when}`
      : `Google data ready · ${listPart}`;
  }

  return "Import starred places, saved lists, and My Maps from Google Maps.";
}

export function importListLabel(source: GoogleMapsSavedListSource): string {
  if (source.type === "starred") return "Starred places";
  return source.name;
}

export function importJobProgressPercent(
  job: GoogleMapsImportJob | undefined,
): number | undefined {
  if (!job || job.total <= 0) return undefined;
  return Math.round((job.processed / job.total) * 100);
}

export function importJobProgressDetail(
  job: GoogleMapsImportJob | undefined,
): string | undefined {
  if (!job) return "Adding pins from your selected lists…";
  if (job.total > 0) {
    const parts = [`${job.processed} of ${job.total} places`];
    if (job.partialSummary) {
      parts.push(formatImportSummary(job.partialSummary));
    }
    return parts.join(" · ");
  }
  return "Adding pins from your selected lists…";
}

function formatPlaceCount(count: number): string {
  return count === 1 ? "1 place" : `${count} places`;
}

function formatListCount(count: number): string {
  return count === 1 ? "1 list" : `${count} lists`;
}

export type WizardImportSessionResult =
  | { status: "completed"; summary: GoogleMapsSavedListsSyncSummary }
  | { status: "failed"; error: string };

export function buildImportProgressSteps(
  job: GoogleMapsImportJob | undefined,
  pendingSources?: readonly GoogleMapsSavedListSource[],
  options?: { completed?: boolean; idle?: boolean },
): Array<{ id: string; label: string; state: "pending" | "current" | "done" }> {
  const sources = job?.sources?.length ? job.sources : pendingSources;
  if (!sources?.length) {
    return [
      {
        id: "import",
        label: "Add pins to map",
        state: options?.completed
          ? "done"
          : options?.idle
            ? "pending"
            : job?.status === "completed"
              ? "done"
              : job && isGoogleMapsImportActive(job)
                ? "current"
                : "pending",
      },
    ];
  }

  const allDone = options?.completed || job?.status === "completed";
  let currentIndex = 0;
  if (job?.phase) {
    const fromPhase = sources.findIndex((source) =>
      job.phase!.includes(importListLabel(source)),
    );
    if (fromPhase >= 0) currentIndex = fromPhase;
  }

  return sources.map((source, index) => {
    const id = source.type === "starred" ? "starred" : source.name;
    let state: "pending" | "current" | "done" = "pending";
    if (options?.idle) {
      state = "pending";
    } else if (allDone || index < currentIndex) {
      state = "done";
    } else if (index === currentIndex && job && isGoogleMapsImportActive(job)) {
      state = "current";
    }
    return {
      id,
      label: importListLabel(source),
      state,
    };
  });
}

export function buildListDiscoveryProgressSteps(
  job: GoogleMapsListDiscoveryJob | undefined,
  options?: { completed?: boolean; idle?: boolean },
): Array<{ id: string; label: string; state: "pending" | "current" | "done" }> {
  const steps = [
    { id: "starred", label: "Export starred places" },
    { id: "collections", label: "Export saved lists" },
    { id: "mymaps", label: "Export My Maps" },
    { id: "coordinates", label: "Resolve coordinates" },
  ] as const;

  if (options?.completed || job?.status === "completed") {
    return steps.map((step) => ({ ...step, state: "done" as const }));
  }

  if (options?.idle || !job) {
    return steps.map((step) => ({ ...step, state: "pending" as const }));
  }

  if (job.status === "resolving_coords") {
    return [
      { ...steps[0], state: "done" },
      { ...steps[1], state: "done" },
      { ...steps[2], state: "done" },
      { ...steps[3], state: "current" },
    ];
  }

  if (job.status === "failed") {
    const failedStep = Math.min(Math.max(job.step, 0), steps.length - 1);
    return steps.map((step, index) => ({
      ...step,
      state:
        index < failedStep
          ? ("done" as const)
          : index === failedStep
            ? ("current" as const)
            : ("pending" as const),
    }));
  }
  const starredState: "pending" | "current" | "done" =
    job.status === "exporting_collections" || job.status === "exporting_mymaps"
      ? "done"
      : job.status === "exporting_starred" || job.status === "pending"
        ? "current"
        : "pending";

  const collectionsState: "pending" | "current" | "done" =
    job.status === "exporting_mymaps"
      ? "done"
      : job.status === "exporting_collections"
        ? "current"
        : "pending";

  const mymapsState: "pending" | "current" | "done" =
    job.status === "exporting_mymaps" ? "current" : "pending";

  return [
    { ...steps[0], state: starredState },
    { ...steps[1], state: collectionsState },
    { ...steps[2], state: mymapsState },
    { ...steps[3], state: "pending" as const },
  ];
}

export function buildDownloadTaskProgress(args: {
  listDiscoveryJob?: GoogleMapsListDiscoveryJob;
  listDiscoveryActive: boolean;
  listDiscoveryFailed: boolean;
  hasExportCache: boolean;
  listCount: number;
  lastExportAt?: string;
}): {
  title: string;
  phase: string;
  detail?: string;
  status: TaskProgressStatus;
  progress?: number;
  steps: ReturnType<typeof buildListDiscoveryProgressSteps>;
} {
  if (args.listDiscoveryFailed) {
    return {
      title: "Downloading from Google",
      phase: "Download failed",
      detail:
        args.listDiscoveryJob?.error ??
        "Could not download from Google. Try again in a few minutes.",
      status: "failed",
      progress: listDiscoveryJobProgressPercent(args.listDiscoveryJob),
      steps: buildListDiscoveryProgressSteps(args.listDiscoveryJob),
    };
  }

  if (args.listDiscoveryActive) {
    return {
      title: "Downloading from Google",
      phase: args.listDiscoveryJob?.phase ?? "Starting export from Google…",
      detail:
        args.listDiscoveryJob?.status === "resolving_coords"
          ? "Looking up coordinates for your saved places. This can take several minutes."
          : "You can close this wizard and come back—the download continues in the background.",
      status: "running",
      progress: listDiscoveryJobProgressPercent(args.listDiscoveryJob),
      steps: buildListDiscoveryProgressSteps(args.listDiscoveryJob),
    };
  }

  if (args.hasExportCache) {
    const when = formatGoogleMapsWhen(args.lastExportAt);
    return {
      title: "Downloading from Google",
      phase: "Download complete",
      detail: when
        ? `${formatListCount(args.listCount)} · downloaded ${when}`
        : formatListCount(args.listCount),
      status: "completed",
      progress: 100,
      steps: buildListDiscoveryProgressSteps(undefined, { completed: true }),
    };
  }

  return {
    title: "Downloading from Google",
    phase: "Not started",
    detail: "Download your Google Maps data to see your lists.",
    status: "unstarted",
    progress: 0,
    steps: buildListDiscoveryProgressSteps(undefined, { idle: true }),
  };
}

export function buildImportTaskProgress(args: {
  importInProgress: boolean;
  importMutPending: boolean;
  importJob?: GoogleMapsImportJob;
  selectedSources: readonly GoogleMapsSavedListSource[];
  selectedPlaceCount: number;
  wizardImportResult?: WizardImportSessionResult | null;
  lastSyncAt?: string;
}): {
  title: string;
  phase: string;
  detail?: string;
  status: TaskProgressStatus;
  progress?: number;
  steps: ReturnType<typeof buildImportProgressSteps>;
} {
  const selectionDetail =
    args.selectedSources.length > 0
      ? `Import ${formatListCount(args.selectedSources.length)} (${formatPlaceCount(args.selectedPlaceCount)}) to this map. Each list becomes a tag on the pins.`
      : "No lists selected. Go back to choose lists or close this wizard.";

  if (args.wizardImportResult?.status === "completed") {
    return {
      title: "Importing to map",
      phase: "Import complete",
      detail: `${formatImportSummary(args.wizardImportResult.summary)}. New pins are on your map and each list was added as a tag.`,
      status: "completed",
      progress: 100,
      steps: buildImportProgressSteps(args.importJob, args.selectedSources, {
        completed: true,
      }),
    };
  }

  if (args.wizardImportResult?.status === "failed") {
    return {
      title: "Importing to map",
      phase: "Import failed",
      detail: args.wizardImportResult.error,
      status: "failed",
      progress: importJobProgressPercent(args.importJob),
      steps: buildImportProgressSteps(args.importJob, args.selectedSources),
    };
  }

  if (args.importInProgress || args.importMutPending) {
    return {
      title: "Importing to map",
      phase: args.importJob?.phase ?? "Starting import…",
      detail: importJobProgressDetail(args.importJob),
      status: "running",
      progress: importJobProgressPercent(args.importJob),
      steps: buildImportProgressSteps(args.importJob, args.selectedSources),
    };
  }

  if (isRecentFailedImport(args.importJob, args.lastSyncAt)) {
    return {
      title: "Importing to map",
      phase: "Last import failed",
      detail: args.importJob?.error ?? "Unknown error",
      status: "failed",
      progress: importJobProgressPercent(args.importJob),
      steps: buildImportProgressSteps(args.importJob, args.selectedSources),
    };
  }

  return {
    title: "Importing to map",
    phase:
      args.selectedSources.length > 0 ? "Ready to import" : "Nothing to import",
    detail: selectionDetail,
    status: "unstarted",
    progress: 0,
    steps: buildImportProgressSteps(undefined, args.selectedSources, {
      idle: true,
    }),
  };
}
