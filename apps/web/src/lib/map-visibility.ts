import type { Visibility } from "@/lib/visibility";

export type MapVisibilityKind = Visibility | "shared";

export function resolveMapVisibility(
  map: { visibility: Visibility },
  memberCount: number,
): MapVisibilityKind {
  if (map.visibility !== "private") return map.visibility;
  if (memberCount > 1) return "shared";
  return "private";
}
