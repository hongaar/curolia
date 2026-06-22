import { exploreCategoryById } from "@/lib/explore-registry";
import type {
  ExploreFilterValues,
  ExploreResultEntry,
} from "@curolia/plugin-contract";
import {
  filterExploreResults,
  resolveExploreFilterValues,
} from "@curolia/plugin-contract";

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
  mapCenter: { lng: number; lat: number } | null,
): Promise<ExploreResultEntry[]> {
  const category = exploreCategoryById(categoryId);
  if (!category) return [];
  const raw = await Promise.resolve(
    category.contribution.fetchResults({ mapCenter, filterValues }),
  );
  return filterExploreResults(category.contribution, raw, filterValues);
}

export function fetchExploreCategoryResultsSync(
  categoryId: string,
  filterValues: ExploreFilterValues,
  mapCenter: { lng: number; lat: number },
): ExploreResultEntry[] {
  const category = exploreCategoryById(categoryId);
  if (!category) return [];
  const raw = category.contribution.fetchResults({ mapCenter, filterValues });
  if (raw instanceof Promise) return [];
  return filterExploreResults(category.contribution, raw, filterValues);
}

export function fetchExploreResultsForCategories(
  categoryIds: readonly string[],
  filterValuesByCategory: Partial<Record<string, ExploreFilterValues>>,
  mapCenter: { lng: number; lat: number },
): ExploreResultEntry[] {
  const out: ExploreResultEntry[] = [];
  for (const categoryId of categoryIds) {
    const filterValues = resolveCategoryFilterValues(
      categoryId,
      filterValuesByCategory[categoryId],
    );
    out.push(
      ...fetchExploreCategoryResultsSync(categoryId, filterValues, mapCenter),
    );
  }
  return out;
}
