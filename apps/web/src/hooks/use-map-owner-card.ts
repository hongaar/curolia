import { shouldShowMapOwnerCard } from "@/lib/map-owner-card";
import { useAuth } from "@/providers/auth-provider";
import { useMap } from "@/providers/map-provider";

import { usePublicMapOwnerProfile } from "./use-public-map-owner-profile";

export function useMapOwnerCard() {
  const { activeMap, activeMapId, publicView } = useMap();
  const { user } = useAuth();
  const enabled = shouldShowMapOwnerCard({
    publicView,
    activeMap,
    userId: user?.id,
  });
  const query = usePublicMapOwnerProfile(activeMapId, enabled);

  return {
    enabled,
    profile: query.data,
    show: enabled && Boolean(query.data),
  };
}
