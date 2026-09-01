import { exploreCategoryById } from "@/lib/explore-registry";
import type {
  ExploreBounds,
  ExploreFilterValues,
  ExploreHostServices,
  ExploreResultEntry,
} from "@curolia/plugin-contract";
import {
  filterExploreResults,
  resolveExploreFilterValues,
} from "@curolia/plugin-contract";

export type ExploreViewport = {
  bounds: ExploreBounds;
  zoom: number;
  mapCenter: { lng: number; lat: number };
};

export function defaultExploreFilterValues(
  categoryId: string,
): ExploreFilterValues {
  const category = exploreCategoryById(categoryId);
  if (!category) return {};
  return { ...category.contribution.defaultFilterValues };
}

export function resolveCategoryFilterValues(
  categoryId: string,
  stored: ExploreFilterValues | undefined,
): ExploreFilterValues {
  const category = exploreCategoryById(categoryId);
  if (!category) return {};
  return resolveExploreFilterValues(
    category.contribution.filters,
    category.contribution.defaultFilterValues,
    stored,
  );
}

export async function fetchExploreCategoryResults(
  categoryId: string,
  filterValues: ExploreFilterValues,
  viewport: ExploreViewport | null,
  services: ExploreHostServices | undefined,
  options?: {
    onUpdate?: (entries: ExploreResultEntry[]) => void;
    fetchUpstreamPages?: boolean;
    signal?: AbortSignal;
  },
): Promise<ExploreResultEntry[]> {
  const category = exploreCategoryById(categoryId);
  if (!category || !viewport || !services) return [];

  const raw = await Promise.resolve(
    category.contribution.fetchResults({
      mapCenter: viewport.mapCenter,
      bounds: viewport.bounds,
      zoom: viewport.zoom,
      filterValues,
      services,
      onEntriesUpdate: (entries) => {
        options?.onUpdate?.(
          filterExploreResults(category.contribution, entries, filterValues),
        );
      },
      fetchUpstreamPages: options?.fetchUpstreamPages,
      signal: options?.signal,
    }),
  );
  return filterExploreResults(category.contribution, raw, filterValues);
}

export async function fetchExploreResultsForCategories(
  categoryIds: readonly string[],
  filterValuesByCategory: Partial<Record<string, ExploreFilterValues>>,
  viewport: ExploreViewport | null,
  services: ExploreHostServices | undefined,
  options?: {
    onUpdate?: (entries: ExploreResultEntry[]) => void;
    fetchUpstreamPages?: boolean;
    signal?: AbortSignal;
  },
): Promise<ExploreResultEntry[]> {
  const merged = new Map<string, ExploreResultEntry>();
  const publish = () => options?.onUpdate?.([...merged.values()]);

  await Promise.all(
    categoryIds.map(async (categoryId) => {
      if (options?.signal?.aborted) return;
      const filterValues = resolveCategoryFilterValues(
        categoryId,
        filterValuesByCategory[categoryId],
      );
      const entries = await fetchExploreCategoryResults(
        categoryId,
        filterValues,
        viewport,
        services,
        {
          onUpdate: (categoryEntries) => {
            for (const entry of categoryEntries) {
              merged.set(`${entry.categoryId}:${entry.id}`, entry);
            }
            publish();
          },
          fetchUpstreamPages: options?.fetchUpstreamPages,
          signal: options?.signal,
        },
      );
      for (const entry of entries) {
        merged.set(`${entry.categoryId}:${entry.id}`, entry);
      }
      publish();
    }),
  );
  return [...merged.values()];
}
