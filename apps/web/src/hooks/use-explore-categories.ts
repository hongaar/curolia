import {
  exploreCategoriesForEnabledPlugins,
  exploreCategoryById,
  exploreTeaserCategoriesFrom,
  type ExploreCategoryId,
} from "@/lib/explore-registry";
import { useEnabledPlugins } from "@/lib/use-enabled-plugins";
import { useAuth } from "@/providers/auth-provider";
import { useCallback, useMemo } from "react";

export function useExploreCategories() {
  const { user } = useAuth();
  const { plugins, userPluginsQuery } = useEnabledPlugins();

  const enabledPluginIds = useMemo(
    () => new Set(plugins.map((plugin) => plugin.id)),
    [plugins],
  );

  const categories = useMemo(() => {
    if (user && userPluginsQuery.isPending) return [];
    return exploreCategoriesForEnabledPlugins(enabledPluginIds);
  }, [user, userPluginsQuery.isPending, enabledPluginIds]);

  const teaserCategories = useMemo(
    () => exploreTeaserCategoriesFrom(categories),
    [categories],
  );

  const categoryById = useCallback(
    (id: ExploreCategoryId) => exploreCategoryById(id, categories),
    [categories],
  );

  const allowedCategoryIds = useMemo(
    () => new Set(categories.map((category) => category.id)),
    [categories],
  );

  return {
    categories,
    teaserCategories,
    categoryById,
    allowedCategoryIds,
    ready: !user || !userPluginsQuery.isPending,
  };
}
