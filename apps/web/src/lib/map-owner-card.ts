import type { MapWithOwnerSlug } from "@/lib/app-paths";

/** Show the map owner card on public maps and when viewing another user's map. */
export function shouldShowMapOwnerCard(options: {
  publicView: boolean;
  activeMap: MapWithOwnerSlug | null;
  userId: string | undefined;
}): boolean {
  const { publicView, activeMap, userId } = options;
  if (publicView) return true;
  return Boolean(
    activeMap && userId && activeMap.created_by_user_id !== userId,
  );
}
