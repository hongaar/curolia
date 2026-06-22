import type { ExploreCategoryId } from "@/lib/explore-categories";
import { useCallback, useState } from "react";

export type ExploreState = {
  expanded: boolean;
  activeCategories: ExploreCategoryId[];
};

export function useExplore() {
  const [expanded, setExpanded] = useState(false);
  const [activeCategories, setActiveCategories] = useState<ExploreCategoryId[]>(
    [],
  );

  const toggleExpanded = useCallback(() => {
    setExpanded((current) => !current);
  }, []);

  const toggleCategory = useCallback((categoryId: ExploreCategoryId) => {
    setActiveCategories((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    );
  }, []);

  return {
    expanded,
    activeCategories,
    toggleExpanded,
    toggleCategory,
  };
}
