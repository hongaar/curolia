import type {
  ExploreHostServices,
  ExplorePlaceDetail,
  ExploreResultEntry,
  ExploreRouteGenerateInput,
  ExploreStaticFetchInput,
} from "@curolia/plugin-contract";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  placesExploreStatic,
  placesGetPlace,
  resolveMaxDistanceMeters,
  routeGenerate,
} from "./explore-edge";

export function createExploreHostServices(
  supabase: SupabaseClient,
): ExploreHostServices {
  return {
    async fetchStaticPlaces(
      input: ExploreStaticFetchInput,
    ): Promise<ExploreResultEntry[]> {
      const hiddenGems =
        input.filterValues.hiddenGems === "gems" ||
        input.filterValues.hiddenGems === "true";
      const res = await placesExploreStatic(
        supabase,
        {
          bounds: input.bounds,
          zoom: input.zoom,
          categoryId: input.categoryId,
          mapCenter: input.mapCenter,
          hiddenGems,
          fetchUpstreamPages: input.fetchUpstreamPages ?? true,
          onUpdate: input.onUpdate,
        },
        input.signal,
      );
      if ("error" in res) {
        console.warn("explore static failed", res.error);
        return res.entries ?? [];
      }
      return res.entries;
    },

    async generateRoutes(
      input: ExploreRouteGenerateInput,
    ): Promise<ExploreResultEntry[]> {
      const profile =
        input.categoryId === "route:cycling" ? "cycling" : "hiking";
      const maxDistanceMeters = resolveMaxDistanceMeters(input.filterValues);
      const res = await routeGenerate(supabase, {
        bounds: input.bounds,
        categoryId: input.categoryId,
        profile,
        maxDistanceMeters,
        mapCenter: input.mapCenter,
      });
      if ("error" in res) {
        console.warn("route generate failed", res.error);
        return [];
      }
      return res.entries;
    },

    async fetchPlaceDetail(
      placeId: string,
    ): Promise<ExplorePlaceDetail | null> {
      const res = await placesGetPlace(supabase, placeId);
      if ("error" in res) return null;
      return res.place;
    },
  };
}
