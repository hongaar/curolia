/** Share of the download progress bar allocated to each phase. */
export const LIST_DISCOVERY_PROGRESS_WEIGHTS = {
  starred: 0.05,
  collections: 0.05,
  mymaps: 0.05,
  coordinates: 0.85,
} as const;

export const LIST_DISCOVERY_EXPORT_COMPLETE_PROGRESS = Math.round(
  (LIST_DISCOVERY_PROGRESS_WEIGHTS.starred +
    LIST_DISCOVERY_PROGRESS_WEIGHTS.collections +
    LIST_DISCOVERY_PROGRESS_WEIGHTS.mymaps) *
    100,
);

const EXPORT_STEP_WEIGHTS = [
  LIST_DISCOVERY_PROGRESS_WEIGHTS.starred,
  LIST_DISCOVERY_PROGRESS_WEIGHTS.collections,
  LIST_DISCOVERY_PROGRESS_WEIGHTS.mymaps,
] as const;

/** Progress while exporting starred places, saved lists, or My Maps (`stepRatio` 0–1). */
export function listDiscoveryExportProgress(
  stepIndex: 0 | 1 | 2,
  stepRatio: number,
): number {
  const ratio = Math.min(1, Math.max(0, stepRatio));
  const start = EXPORT_STEP_WEIGHTS.slice(0, stepIndex).reduce(
    (sum, weight) => sum + weight,
    0,
  );
  const weight = EXPORT_STEP_WEIGHTS[stepIndex] ?? 0;
  return Math.round((start + weight * ratio) * 100);
}

/** Progress while resolving coordinates (`urlsDone` / `urlsTotal`). */
export function listDiscoveryCoordProgress(
  urlsDone: number,
  urlsTotal: number,
): number {
  const ratio = urlsDone / Math.max(urlsTotal, 1);
  const start =
    LIST_DISCOVERY_PROGRESS_WEIGHTS.starred +
    LIST_DISCOVERY_PROGRESS_WEIGHTS.collections +
    LIST_DISCOVERY_PROGRESS_WEIGHTS.mymaps;
  return Math.round(
    (start + LIST_DISCOVERY_PROGRESS_WEIGHTS.coordinates * ratio) * 100,
  );
}
