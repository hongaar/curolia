/** Join location/date and optional plugin fragments for pin detail subtitle. */
export function combinePinDetailSubtitle(
  ...parts: (string | null | undefined)[]
): string {
  return parts
    .map((p) => p?.trim())
    .filter((p): p is string => Boolean(p))
    .join(" · ");
}
