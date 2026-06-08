/** Share of the download progress bar allocated to each phase. */
export const LIST_DISCOVERY_PROGRESS_WEIGHTS = {
  starred: 0.05,
  collections: 0.05,
  coordinates: 0.9,
} as const;

export const LIST_DISCOVERY_EXPORT_COMPLETE_PROGRESS = Math.round(
  (LIST_DISCOVERY_PROGRESS_WEIGHTS.starred +
    LIST_DISCOVERY_PROGRESS_WEIGHTS.collections) *
    100,
);

/** Progress while exporting starred places or saved lists (`stepRatio` 0–1). */
export function listDiscoveryExportProgress(
  stepIndex: 0 | 1,
  stepRatio: number,
): number {
  const ratio = Math.min(1, Math.max(0, stepRatio));
  const start = stepIndex === 0 ? 0 : LIST_DISCOVERY_PROGRESS_WEIGHTS.starred;
  const weight =
    stepIndex === 0
      ? LIST_DISCOVERY_PROGRESS_WEIGHTS.starred
      : LIST_DISCOVERY_PROGRESS_WEIGHTS.collections;
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
    LIST_DISCOVERY_PROGRESS_WEIGHTS.collections;
  return Math.round(
    (start + LIST_DISCOVERY_PROGRESS_WEIGHTS.coordinates * ratio) * 100,
  );
}
