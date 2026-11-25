import type { ExploreCategoryId } from "@/lib/explore-registry";
import type {
  ExploreFilterValues,
  ExploreResultEntry,
} from "@curolia/plugin-contract";
import { createContext, useContext } from "react";

export type ExploreState = {
  expanded: boolean;
  activeCategories: ExploreCategoryId[];
  focusedCategoryId: ExploreCategoryId | null;
  filterValuesByCategory: Partial<
    Record<ExploreCategoryId, ExploreFilterValues>
  >;
  selectedEntry: ExploreResultEntry | null;
};

export type ExploreContextValue = ExploreState & {
  cardExpanded: boolean;
  toggleExpanded: () => void;
  toggleCategory: (categoryId: ExploreCategoryId) => void;
  selectCategory: (categoryId: ExploreCategoryId) => void;
  activateCategory: (categoryId: ExploreCategoryId) => void;
  setFocusedCategory: (categoryId: ExploreCategoryId | null) => void;
  setFilterValue: (
    categoryId: ExploreCategoryId,
    filterId: string,
    value: string | readonly string[] | number,
  ) => void;
  selectedEntry: ExploreResultEntry | null;
  setSelectedEntry: (entry: ExploreResultEntry | null) => void;
  getFilterValues: (categoryId: ExploreCategoryId) => ExploreFilterValues;
};

export const ExploreContext = createContext<ExploreContextValue | null>(null);

export function useExplore(): ExploreContextValue {
  const ctx = useContext(ExploreContext);
  if (!ctx) {
    throw new Error("useExplore must be used within ExploreProvider");
  }
  return ctx;
}
