function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = import.meta.env[name]?.trim().toLowerCase();
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return defaultValue;
}

/** Product feature toggles for gradual rollout. */
export const featureFlags = {
  /** Show the "Recently visited" stream on the home feed. Visits are always recorded. */
  homeRecentlyVisited: envFlag("VITE_FEATURE_HOME_RECENTLY_VISITED", false),
} as const;
