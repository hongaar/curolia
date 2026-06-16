export type MapVisibilityKind = "private" | "public" | "shared";

export function resolveMapVisibility(
  map: { is_public: boolean },
  memberCount: number,
): MapVisibilityKind {
  if (map.is_public) return "public";
  if (memberCount > 1) return "shared";
  return "private";
}
