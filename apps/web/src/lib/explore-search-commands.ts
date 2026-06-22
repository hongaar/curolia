import {
  allExploreCategories,
  type ExploreCategory,
  type ExploreCategoryId,
} from "@/lib/explore-registry";
import type {
  GlobalSearchCommandContext,
  GlobalSearchCommandDef,
} from "@/lib/global-search-commands";

export const EXPLORE_COMMAND_PREFIX = "explore:";

export function exploreSearchCommandId(categoryId: ExploreCategoryId): string {
  return `${EXPLORE_COMMAND_PREFIX}${categoryId}`;
}

export function exploreCategoryFromCommandId(
  commandId: string,
  categories: readonly ExploreCategory[] = allExploreCategories(),
): ExploreCategoryId | null {
  if (!commandId.startsWith(EXPLORE_COMMAND_PREFIX)) return null;
  const categoryId = commandId.slice(EXPLORE_COMMAND_PREFIX.length);
  return categories.some((category) => category.id === categoryId)
    ? categoryId
    : null;
}

export function isExploreSearchCommandId(
  commandId: string,
  categories: readonly ExploreCategory[] = allExploreCategories(),
): boolean {
  return exploreCategoryFromCommandId(commandId, categories) != null;
}

function exploreCommandSubtitle(category: ExploreCategory): string {
  return category.chipVariant === "route"
    ? "Show nearby routes on the map"
    : "Show nearby places on the map";
}

export function buildExploreSearchCommands(
  categories: readonly ExploreCategory[],
): GlobalSearchCommandDef[] {
  return categories.map((category) => ({
    id: exploreSearchCommandId(category.id),
    section: "actions" as const,
    title: `Explore ${category.label.toLowerCase()}`,
    subtitle: exploreCommandSubtitle(category),
    keywords: [
      "explore",
      "category",
      category.label.toLowerCase(),
      category.id,
      category.chipVariant,
      category.pluginId,
    ],
    isAvailable: (ctx: GlobalSearchCommandContext) =>
      ctx.mapViewContext != null && Boolean(ctx.activateExploreCategory),
  }));
}

export function exploreCategoryForCommand(
  commandId: string,
  categories: readonly ExploreCategory[],
): ExploreCategory | undefined {
  const categoryId = exploreCategoryFromCommandId(commandId, categories);
  if (!categoryId) return undefined;
  return categories.find((category) => category.id === categoryId);
}
