import { installedPluginManifests } from "@/plugins/generated-manifests";
import type {
  ExploreCategoryContribution,
  ExploreChipVariant,
  PluginIconComponent,
} from "@curolia/plugin-contract";

export type ExploreCategoryId = string;

export type ExploreCategory = {
  id: ExploreCategoryId;
  label: string;
  color: string;
  icon: PluginIconComponent;
  chipVariant: ExploreChipVariant;
  pluginId: string;
  contribution: ExploreCategoryContribution;
};

/** Collapsed explore chip row shows this many categories before “more”. */
export const EXPLORE_TEASER_COUNT = 3;

function buildExploreCategory(
  pluginId: string,
  contribution: ExploreCategoryContribution,
): ExploreCategory {
  return {
    id: contribution.id,
    label: contribution.label,
    color: contribution.color,
    icon: contribution.icon,
    chipVariant: contribution.chipVariant,
    pluginId,
    contribution,
  };
}

function loadAllExploreCategories(): ExploreCategory[] {
  const out: ExploreCategory[] = [];
  for (const plugin of installedPluginManifests) {
    for (const contribution of plugin.exploreCategories ?? []) {
      out.push(buildExploreCategory(plugin.id, contribution));
    }
  }
  return out;
}

let cachedAllCategories: ExploreCategory[] | null = null;

/** Every explore category declared by installed plugins. */
export function allExploreCategories(): readonly ExploreCategory[] {
  cachedAllCategories ??= loadAllExploreCategories();
  return cachedAllCategories;
}

export function exploreCategoriesForEnabledPlugins(
  enabledPluginIds: ReadonlySet<string> | readonly string[],
): readonly ExploreCategory[] {
  const enabled =
    enabledPluginIds instanceof Set
      ? enabledPluginIds
      : new Set(enabledPluginIds);
  return allExploreCategories().filter((category) =>
    enabled.has(category.pluginId),
  );
}

export function exploreCategoryById(
  id: ExploreCategoryId,
  categories: readonly ExploreCategory[] = allExploreCategories(),
): ExploreCategory | undefined {
  return categories.find((category) => category.id === id);
}

export function exploreTeaserCategoriesFrom(
  categories: readonly ExploreCategory[],
): readonly ExploreCategory[] {
  return categories.slice(0, EXPLORE_TEASER_COUNT);
}

/** @deprecated Use chipVariant on {@link ExploreCategory}. */
export type ExploreCategoryKind = ExploreChipVariant;
