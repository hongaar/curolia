import type {
  ExploreCategory,
  ExploreCategoryId,
} from "@/lib/explore-categories";
import {
  CategoryChip,
  CategoryChipCollapse,
  CategoryChipGrid,
  CategoryChipMore,
  CategoryChipPanel,
  CategoryChipPanelBody,
  CategoryChipRow,
  CategoryChipTransition,
} from "@curolia/ui/category-chips";

function ExploreCategoryChip({
  category,
  active,
  onToggle,
}: {
  category: ExploreCategory;
  active: boolean;
  onToggle: () => void;
}) {
  const Icon = category.icon;
  return (
    <CategoryChip
      variant={category.chipVariant}
      icon={<Icon aria-hidden />}
      label={category.label}
      active={active}
      onClick={onToggle}
    />
  );
}

function ExploreTeaserChip({
  category,
  activeCategoryId,
  onToggleCategory,
}: {
  category: ExploreCategory;
  activeCategoryId: ExploreCategoryId | null;
  onToggleCategory: (categoryId: ExploreCategoryId) => void;
}) {
  const Icon = category.icon;
  return (
    <CategoryChip
      variant={category.chipVariant}
      icon={<Icon aria-hidden />}
      label={category.label}
      active={activeCategoryId === category.id}
      onClick={() => onToggleCategory(category.id)}
    />
  );
}

export function ExploreToolbar({
  categories,
  teaserCategories,
  activeCategories,
  focusedCategoryId,
  expanded,
  onToggleExpanded,
  onToggleCategory,
}: {
  categories: readonly ExploreCategory[];
  teaserCategories: readonly ExploreCategory[];
  activeCategories: readonly ExploreCategoryId[];
  focusedCategoryId: ExploreCategoryId | null;
  expanded: boolean;
  onToggleExpanded: () => void;
  onToggleCategory: (categoryId: ExploreCategoryId) => void;
  onSelectCategory: (categoryId: ExploreCategoryId) => void;
}) {
  if (categories.length === 0) {
    return null;
  }

  const activeCategoryId = focusedCategoryId ?? activeCategories[0] ?? null;

  return (
    <CategoryChipTransition
      expanded={expanded}
      collapsed={
        <CategoryChipRow aria-label="Explore categories">
          {teaserCategories.map((category) => (
            <ExploreTeaserChip
              key={category.id}
              category={category}
              activeCategoryId={activeCategoryId}
              onToggleCategory={onToggleCategory}
            />
          ))}
          {categories.length > teaserCategories.length ? (
            <CategoryChipMore onClick={onToggleExpanded} />
          ) : null}
        </CategoryChipRow>
      }
      expandedPane={
        <CategoryChipPanel aria-label="Explore categories">
          <CategoryChipCollapse onClick={onToggleExpanded} />
          <CategoryChipPanelBody>
            <CategoryChipGrid>
              {categories.map((category) => (
                <ExploreCategoryChip
                  key={category.id}
                  category={category}
                  active={activeCategoryId === category.id}
                  onToggle={() => onToggleCategory(category.id)}
                />
              ))}
            </CategoryChipGrid>
          </CategoryChipPanelBody>
        </CategoryChipPanel>
      }
    />
  );
}
