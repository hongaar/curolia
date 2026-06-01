/** Shown when `maps.icon_emoji` is null. */
export function defaultMapIcon(isPersonal: boolean): string {
  return isPersonal ? "📓" : "📔";
}

/** Persist null when the chosen emoji matches the built-in default for that map. */
export function normalizeMapIconForPersist(
  selected: string,
  isPersonal: boolean,
): string | null {
  const t = selected.trim();
  if (!t) return null;
  return t === defaultMapIcon(isPersonal) ? null : t;
}
