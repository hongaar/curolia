import type { TaskProgressStatus } from "@curolia/ui/task-progress";
import type {
  PolarstepsImportJob,
  PolarstepsSyncSummary,
  PolarstepsTripPreview,
} from "./config";
import { isPolarstepsImportActive } from "./config";

export const WIZARD_STEPS = [
  { id: "trips", title: "Choose trips" },
  { id: "import", title: "Import" },
] as const;

export function formatPolarstepsWhen(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString();
}

export function formatImportedTripCount(count: number): string {
  return count === 1
    ? "1 trip added to this map"
    : `${count} trips added to this map`;
}

export function formatImportSummary(summary: PolarstepsSyncSummary): string {
  const parts = [`${summary.added} pins added`];
  if (summary.tagged) parts.push(`${summary.tagged} tagged`);
  parts.push(`${summary.skipped} skipped`);
  if (summary.failed) parts.push(`${summary.failed} failed`);
  if (summary.photosImported) {
    parts.push(`${summary.photosImported} photos`);
  }
  if (summary.photosFailed) {
    parts.push(`${summary.photosFailed} photo errors`);
  }
  return parts.join(", ");
}

export function isStaleActiveImportJob(
  importJob: PolarstepsImportJob | undefined,
  lastSyncAt: string | undefined,
): boolean {
  return Boolean(
    importJob &&
    lastSyncAt &&
    isPolarstepsImportActive(importJob) &&
    new Date(lastSyncAt).getTime() >= new Date(importJob.startedAt).getTime(),
  );
}

export function isImportInProgress(
  importJob: PolarstepsImportJob | undefined,
  lastSyncAt: string | undefined,
): boolean {
  return (
    isPolarstepsImportActive(importJob) &&
    !isStaleActiveImportJob(importJob, lastSyncAt)
  );
}

export function buildMapSettingsStatus({
  pluginGloballyEnabled,
  tripCount,
  lastSyncAt,
  lastSyncSummary,
  importJob,
  importedTripCount,
}: {
  pluginGloballyEnabled: boolean;
  tripCount?: number;
  lastSyncAt?: string;
  lastSyncSummary?: PolarstepsSyncSummary;
  importJob?: PolarstepsImportJob;
  importedTripCount: number;
}): string | null {
  if (!pluginGloballyEnabled) {
    return "Turn on Polarsteps under Plugins (user menu) to import trips.";
  }
  if (isPolarstepsImportActive(importJob)) {
    return importJob?.phase ?? "Import in progress…";
  }
  if (lastSyncAt && lastSyncSummary) {
    const when = formatPolarstepsWhen(lastSyncAt);
    return when
      ? `Last import ${when}: ${formatImportSummary(lastSyncSummary)}`
      : formatImportSummary(lastSyncSummary);
  }
  if (importedTripCount > 0) {
    return formatImportedTripCount(importedTripCount);
  }
  if (tripCount && tripCount > 0) {
    return `${tripCount} trip${tripCount === 1 ? "" : "s"} ready to import`;
  }
  return "Paste a Polarsteps share link to import steps and photos.";
}

export function buildImportTaskProgress(args: {
  importInProgress: boolean;
  importMutPending: boolean;
  importJob?: PolarstepsImportJob;
  wizardImportResult?: WizardImportSessionResult | null;
}): {
  title: string;
  phase: string;
  detail?: string;
  status: TaskProgressStatus;
  progress?: number;
} {
  if (args.wizardImportResult) {
    return {
      title: "Importing to map",
      phase: "Import complete",
      detail: formatImportSummary(args.wizardImportResult.summary),
      status: "completed",
      progress: 100,
    };
  }

  if (args.importJob?.status === "failed") {
    return {
      title: "Importing to map",
      phase: "Import failed",
      detail: args.importJob.error ?? "Import failed.",
      status: "failed",
      progress: args.importJob.total
        ? Math.round((args.importJob.processed / args.importJob.total) * 100)
        : undefined,
    };
  }

  if (args.importInProgress || args.importMutPending) {
    const total = Math.max(args.importJob?.total ?? 0, 1);
    const processed = args.importJob?.processed ?? 0;
    return {
      title: "Importing to map",
      phase: args.importJob?.phase ?? "Starting import…",
      detail: "Downloading photos may take a few minutes for large trips.",
      status: "running",
      progress: Math.round((processed / total) * 100),
    };
  }

  return {
    title: "Importing to map",
    phase: "Ready to import",
    status: "unstarted",
  };
}

export type WizardImportSessionResult = {
  summary: PolarstepsSyncSummary;
  finishedAt: string;
};

export function tripListLabel(trip: PolarstepsTripPreview): string {
  const parts = [trip.title];
  parts.push(trip.stepCount === 1 ? "1 step" : `${trip.stepCount} steps`);
  if (trip.photoCount) {
    parts.push(trip.photoCount === 1 ? "1 photo" : `${trip.photoCount} photos`);
  }
  return parts.join(" · ");
}
