import type { MapWithOwnerSlug } from "@/lib/app-paths";
import type { CuroliaMap } from "@/types/database";
import { createContext, useContext } from "react";

export type RouteMapStatus = "none" | "loading" | "ready" | "unavailable";

export type MapContextValue = {
  maps: MapWithOwnerSlug[];
  /** Maps the signed-in user is a member of (excludes foreign maps being browsed). */
  memberMaps: MapWithOwnerSlug[];
  activeMap: MapWithOwnerSlug | null;
  activeMapId: string | null;
  setActiveMapId: (id: string) => void;
  loading: boolean;
  routeMapStatus: RouteMapStatus;
  publicView: boolean;
  refetch: () => Promise<void>;
  createMap: (
    name: string,
    iconEmoji?: string | null,
  ) => Promise<{ map: CuroliaMap | null; error: Error | null }>;
};

export const MapContext = createContext<MapContextValue | null>(null);

export function useMap() {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMap must be used within MapProvider");
  return ctx;
}
