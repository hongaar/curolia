import type { ExploreCategoryId } from "@/lib/explore-registry";
import { exploreCategoriesForEnabledPlugins } from "@/lib/explore-registry";
import {
  defaultExploreFilterValues,
  resolveCategoryFilterValues,
} from "@/lib/explore-results";
import { useEnabledPlugins } from "@/lib/use-enabled-plugins";
import { useAuth } from "@/providers/auth-provider";
import type { ExploreFilterValues } from "@curolia/plugin-contract";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ExploreState = {
  expanded: boolean;
  activeCategories: ExploreCategoryId[];
  focusedCategoryId: ExploreCategoryId | null;
  filterValuesByCategory: Partial<
    Record<ExploreCategoryId, ExploreFilterValues>
  >;
};

type ExploreContextValue = ExploreState & {
  cardExpanded: boolean;
  toggleExpanded: () => void;
  toggleCategory: (categoryId: ExploreCategoryId) => void;
  selectCategory: (categoryId: ExploreCategoryId) => void;
  activateCategory: (categoryId: ExploreCategoryId) => void;
  setFocusedCategory: (categoryId: ExploreCategoryId | null) => void;
  setFilterValue: (
    categoryId: ExploreCategoryId,
    filterId: string,
    value: string | readonly string[],
  ) => void;
  getFilterValues: (categoryId: ExploreCategoryId) => ExploreFilterValues;
};

const ExploreContext = createContext<ExploreContextValue | null>(null);

export function ExploreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { plugins, userPluginsQuery } = useEnabledPlugins();
  const [expanded, setExpanded] = useState(false);
  const [activeCategories, setActiveCategories] = useState<ExploreCategoryId[]>(
    [],
  );
  const [focusedCategoryId, setFocusedCategoryId] =
    useState<ExploreCategoryId | null>(null);
  const [filterValuesByCategory, setFilterValuesByCategory] = useState<
    Partial<Record<ExploreCategoryId, ExploreFilterValues>>
  >({});

  const allowedCategoryIds = useMemo(() => {
    if (user && userPluginsQuery.isPending) return new Set<string>();
    const enabledPluginIds = new Set(plugins.map((plugin) => plugin.id));
    return new Set(
      exploreCategoriesForEnabledPlugins(enabledPluginIds).map(
        (category) => category.id,
      ),
    );
  }, [user, userPluginsQuery.isPending, plugins]);

  const pluginsReady = !user || !userPluginsQuery.isPending;

  useEffect(() => {
    if (!pluginsReady) return;

    setActiveCategories((current) => {
      const next = current.filter((id) => allowedCategoryIds.has(id));
      setFocusedCategoryId((focused) => {
        if (focused && allowedCategoryIds.has(focused)) return focused;
        return next.length > 0 ? next[0]! : null;
      });
      return next;
    });
  }, [pluginsReady, allowedCategoryIds]);

  const toggleExpanded = useCallback(() => {
    setExpanded((current) => !current);
  }, []);

  const selectCategory = useCallback(
    (categoryId: ExploreCategoryId) => {
      if (!allowedCategoryIds.has(categoryId)) return;
      setExpanded(true);
      setFocusedCategoryId(categoryId);
      setActiveCategories([categoryId]);
      setFilterValuesByCategory((filters) =>
        filters[categoryId]
          ? filters
          : {
              ...filters,
              [categoryId]: defaultExploreFilterValues(categoryId),
            },
      );
    },
    [allowedCategoryIds],
  );

  const activateCategory = selectCategory;

  const toggleCategory = useCallback(
    (categoryId: ExploreCategoryId) => {
      if (!allowedCategoryIds.has(categoryId)) return;
      setActiveCategories((current) => {
        if (current.includes(categoryId)) {
          setFocusedCategoryId(null);
          return [];
        }
        setFocusedCategoryId(categoryId);
        setFilterValuesByCategory((filters) =>
          filters[categoryId]
            ? filters
            : {
                ...filters,
                [categoryId]: defaultExploreFilterValues(categoryId),
              },
        );
        return [categoryId];
      });
    },
    [allowedCategoryIds],
  );

  const setFilterValue = useCallback(
    (
      categoryId: ExploreCategoryId,
      filterId: string,
      value: string | readonly string[],
    ) => {
      setFilterValuesByCategory((current) => {
        const base = resolveCategoryFilterValues(
          categoryId,
          current[categoryId],
        );
        return {
          ...current,
          [categoryId]: {
            ...base,
            [filterId]: value,
          },
        };
      });
    },
    [],
  );

  const getFilterValues = useCallback(
    (categoryId: ExploreCategoryId) =>
      resolveCategoryFilterValues(
        categoryId,
        filterValuesByCategory[categoryId],
      ),
    [filterValuesByCategory],
  );

  const cardExpanded = focusedCategoryId != null;

  const value = useMemo(
    (): ExploreContextValue => ({
      expanded,
      activeCategories,
      focusedCategoryId,
      filterValuesByCategory,
      cardExpanded,
      toggleExpanded,
      toggleCategory,
      selectCategory,
      activateCategory,
      setFocusedCategory: setFocusedCategoryId,
      setFilterValue,
      getFilterValues,
    }),
    [
      expanded,
      activeCategories,
      focusedCategoryId,
      filterValuesByCategory,
      cardExpanded,
      toggleExpanded,
      toggleCategory,
      selectCategory,
      activateCategory,
      setFilterValue,
      getFilterValues,
    ],
  );

  return (
    <ExploreContext.Provider value={value}>{children}</ExploreContext.Provider>
  );
}

export function useExplore(): ExploreContextValue {
  const ctx = useContext(ExploreContext);
  if (!ctx) {
    throw new Error("useExplore must be used within ExploreProvider");
  }
  return ctx;
}
