import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";

import { useDebouncedExploreViewport } from "@/hooks/use-debounced-explore-viewport";
import type { ExploreCategoryId } from "@/lib/explore-registry";
import {
  fetchExploreCategoryResults,
  fetchExploreResultsForCategories,
  type ExploreViewport,
} from "@/lib/explore-results";
import { createExploreHostServices } from "@/lib/explore-services";
import { exploreViewportSyncKey } from "@/lib/explore-viewport";
import { supabase } from "@/lib/supabase";
import type { ExploreFilterValues } from "@curolia/plugin-contract";

export function useExploreHostServices() {
  return useMemo(() => createExploreHostServices(supabase), []);
}

function exploreMapResultsQueryKey(
  activeCategories: readonly ExploreCategoryId[],
  filterValuesByCategory: Partial<
    Record<ExploreCategoryId, ExploreFilterValues>
  >,
  viewport: ExploreViewport | null,
) {
  const viewportKey = viewport ? exploreViewportSyncKey(viewport) : null;
  return [
    "explore-map-results",
    activeCategories,
    filterValuesByCategory,
    viewportKey,
  ] as const;
}

export function useExploreMapResults(
  activeCategories: readonly ExploreCategoryId[],
  filterValuesByCategory: Partial<
    Record<ExploreCategoryId, ExploreFilterValues>
  >,
  viewport: ExploreViewport | null,
) {
  const services = useExploreHostServices();
  const queryClient = useQueryClient();
  const debouncedViewport = useDebouncedExploreViewport(viewport);
  const queryKey = exploreMapResultsQueryKey(
    activeCategories,
    filterValuesByCategory,
    debouncedViewport,
  );

  return useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      fetchExploreResultsForCategories(
        activeCategories,
        filterValuesByCategory,
        debouncedViewport,
        services,
        {
          onUpdate: (entries) => {
            queryClient.setQueryData(queryKey, entries);
          },
          fetchUpstreamPages: true,
          signal,
        },
      ),
    enabled: activeCategories.length > 0 && debouncedViewport != null,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

/** @deprecated Use shared map results filtered by category in ExplorePanelCard. */
export function useExplorePanelResults(
  focusedCategoryId: ExploreCategoryId | null,
  filterValues: ExploreFilterValues,
  viewport: ExploreViewport | null,
  enabled: boolean,
) {
  const services = useExploreHostServices();
  const debouncedViewport = useDebouncedExploreViewport(viewport);

  return useQuery({
    queryKey: [
      "explore-panel-results",
      focusedCategoryId,
      filterValues,
      debouncedViewport ? exploreViewportSyncKey(debouncedViewport) : null,
    ],
    queryFn: ({ signal }) =>
      fetchExploreCategoryResults(
        focusedCategoryId!,
        filterValues,
        debouncedViewport,
        services,
        { signal },
      ),
    enabled: enabled && focusedCategoryId != null && debouncedViewport != null,
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}
