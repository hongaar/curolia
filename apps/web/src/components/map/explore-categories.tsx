import {
  EXPLORE_CATEGORIES,
  EXPLORE_POI_CATEGORIES,
  type ExploreCategory,
  type ExploreCategoryId,
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
  onToggle,
}: {
  category: ExploreCategory;
  active: boolean;
  onToggle: () => void;
}) {
  const Icon = category.icon;
  return (
    <CategoryChip
      variant={category.kind}
      icon={<Icon aria-hidden />}
      label={category.label}
      active={active}
      onClick={onToggle}
    />
  );
}

export function ExploreToolbar({
  activeCategories,
  expanded,
  onToggleExpanded,
  onToggleCategory,
}: {
  activeCategories: readonly ExploreCategoryId[];
  expanded: boolean;
  onToggleExpanded: () => void;
  onToggleCategory: (categoryId: ExploreCategoryId) => void;
}) {
  const teaser = EXPLORE_POI_CATEGORIES[0];
  const TeaserIcon = teaser.icon;

  if (!expanded) {
    return (
      <CategoryChipRow aria-label="Explore categories">
        <CategoryChip
          icon={<TeaserIcon aria-hidden />}
          label={teaser.label}
          active={activeCategories.includes(teaser.id)}
          onClick={() => onToggleCategory(teaser.id)}
        />
        <CategoryChipMore onClick={onToggleExpanded} />
      </CategoryChipRow>
    );
  }

  return (
    <CategoryChipPanel aria-label="Explore categories">
      <CategoryChipCollapse onClick={onToggleExpanded} />
      <CategoryChipPanelBody>
        <CategoryChipGrid>
          {EXPLORE_CATEGORIES.map((category) => (
            <ExploreCategoryChip
              key={category.id}
              category={category}
              active={activeCategories.includes(category.id)}
              onToggle={() => onToggleCategory(category.id)}
            />
          ))}
        </CategoryChipGrid>
      </CategoryChipPanelBody>
    </CategoryChipPanel>
  );
}
