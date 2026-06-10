import {
  fetchPublicMapOwnerProfile,
  type PublicMapOwnerProfile,
} from "@/lib/fetch-public-map";
import { useQuery } from "@tanstack/react-query";

export type { PublicMapOwnerProfile };

export function usePublicMapOwnerProfile(
  mapId: string | null | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["public_map_owner", mapId],
    queryFn: async (): Promise<PublicMapOwnerProfile | null> => {
      if (!mapId) return null;
      return fetchPublicMapOwnerProfile(mapId);
    },
    enabled: Boolean(mapId && enabled),
  });
}
