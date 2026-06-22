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
} from "@curolia/ui/category-chips";

function ExploreCategoryChip({
  category,
  active,
  focused,
  onSelect,
  onToggle,
}: {
  category: ExploreCategory;
  active: boolean;
  focused: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const Icon = category.icon;
  return (
    <CategoryChip
      variant={category.chipVariant}
      icon={<Icon aria-hidden />}
      label={category.label}
      active={active}
      onClick={() => {
        if (active && !focused) {
          onSelect();
          return;
        }
        onToggle();
      }}
    />
  );
}

function ExploreTeaserChip({
  category,
  activeCategories,
  focusedCategoryId,
  onSelectCategory,
  onToggleCategory,
}: {
  category: ExploreCategory;
  activeCategories: readonly ExploreCategoryId[];
  focusedCategoryId: ExploreCategoryId | null;
  onSelectCategory: (categoryId: ExploreCategoryId) => void;
  onToggleCategory: (categoryId: ExploreCategoryId) => void;
}) {
  const Icon = category.icon;
  return (
    <CategoryChip
      variant={category.chipVariant}
      icon={<Icon aria-hidden />}
      label={category.label}
      active={activeCategories.includes(category.id)}
      onClick={() => {
        if (
          activeCategories.includes(category.id) &&
          focusedCategoryId !== category.id
        ) {
          onSelectCategory(category.id);
          return;
        }
        onToggleCategory(category.id);
      }}
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
  onSelectCategory,
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

  if (!expanded) {
    return (
      <CategoryChipRow aria-label="Explore categories">
        {teaserCategories.map((category) => (
          <ExploreTeaserChip
            key={category.id}
            category={category}
            activeCategories={activeCategories}
            focusedCategoryId={focusedCategoryId}
            onSelectCategory={onSelectCategory}
            onToggleCategory={onToggleCategory}
          />
        ))}
        {categories.length > teaserCategories.length ? (
          <CategoryChipMore onClick={onToggleExpanded} />
        ) : null}
      </CategoryChipRow>
    );
  }

  return (
    <CategoryChipPanel aria-label="Explore categories">
      <CategoryChipCollapse onClick={onToggleExpanded} />
      <CategoryChipPanelBody>
        <CategoryChipGrid>
          {categories.map((category) => (
            <ExploreCategoryChip
              key={category.id}
              category={category}
              active={activeCategories.includes(category.id)}
              focused={focusedCategoryId === category.id}
              onSelect={() => onSelectCategory(category.id)}
              onToggle={() => onToggleCategory(category.id)}
            />
          ))}
        </CategoryChipGrid>
      </CategoryChipPanelBody>
    </CategoryChipPanel>
  );
}
