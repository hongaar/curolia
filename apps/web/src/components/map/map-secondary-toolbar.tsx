import { MapViewSwitcher } from "@/components/layout/map-view-switcher";
import { ExploreToolbar } from "@/components/map/explore-categories";
import { ExplorePanelCard } from "@/components/map/explore-panel-card";
import { MapQuickSettingsTrigger } from "@/components/map/map-quick-settings-trigger";
import { MapPicker } from "@/components/map/map-picker";
import { useExploreCategories } from "@/hooks/use-explore-categories";
import type { ExploreCategoryId } from "@/lib/explore-categories";
import type { ExploreViewport } from "@/lib/explore-results";
import { defaultMapIcon } from "@/lib/map-display-icon";
import { useAuth } from "@/providers/auth-provider";
import { useMap } from "@/providers/map-context";
import type { ExploreResultEntry } from "@curolia/plugin-contract";
import {
  MapSecondaryToolbarExplore,
  MapSecondaryToolbarNav,
  MapSecondaryToolbarShell,
} from "@curolia/ui/map";
import { PublicMapToolbarInfo } from "@curolia/ui/map-picker";

/** Member map picker, or read-only map info for public viewers. */
export function MapToolbarPicker({
  density = "auto",
}: {
  density?: "auto" | "compact" | "full";
}) {
  const { user } = useAuth();
  const { activeMap, publicView } = useMap();
  if (user) return <MapPicker density={density} />;
  if (publicView && activeMap) {
    return (
      <PublicMapToolbarInfo
        density={density}
        mapEmoji={activeMap.icon_emoji ?? defaultMapIcon()}
        mapName={activeMap.name.trim() || "Map"}
      />
    );
  }
  return null;
}

export function MapSecondaryToolbar({
  placement = "top-left",
  activeCategories,
  focusedCategoryId,
  exploreExpanded,
  onToggleExploreExpanded,
  onToggleCategory,
  onSelectCategory,
  exploreViewport,
  exploreEntries,
  exploreResultsFetching,
  onGenerateExploreRoutes,
  onSelectExploreEntry,
  showNav = true,
  quickSettingsOpen,
  onQuickSettingsClick,
  showQuickSettings,
}: {
  placement?: "top-left" | "bottom-center";
  activeCategories: readonly ExploreCategoryId[];
  focusedCategoryId: ExploreCategoryId | null;
  exploreExpanded: boolean;
  onToggleExploreExpanded: () => void;
  onToggleCategory: (categoryId: ExploreCategoryId) => void;
  onSelectCategory: (categoryId: ExploreCategoryId) => void;
  exploreViewport?: ExploreViewport | null;
  exploreEntries?: readonly ExploreResultEntry[];
  exploreResultsFetching?: boolean;
  onGenerateExploreRoutes?: () => void;
  onSelectExploreEntry?: (entry: ExploreResultEntry) => void;
  /** Top-left only: omit the picker/view-switcher row (rendered at bottom-center on mobile). */
  showNav?: boolean;
  quickSettingsOpen?: boolean;
  onQuickSettingsClick?: () => void;
  showQuickSettings?: boolean;
}) {
  const { categories, teaserCategories, categoryById } = useExploreCategories();
  const condensed = placement === "bottom-center";
  const pickerDensity = condensed ? "compact" : "auto";

  const showExplore =
    !condensed &&
    (categories.length > 0 ||
      (focusedCategoryId != null && categoryById(focusedCategoryId) != null));

  const nav = (
    <MapSecondaryToolbarNav placement={placement}>
      <MapToolbarPicker density={pickerDensity} />
      <MapViewSwitcher size="default" labelMode="container" />
      {showQuickSettings ? (
        <MapQuickSettingsTrigger
          open={Boolean(quickSettingsOpen)}
          onClick={onQuickSettingsClick ?? (() => undefined)}
        />
      ) : null}
    </MapSecondaryToolbarNav>
  );

  if (condensed) {
    return nav;
  }

  return (
    <MapSecondaryToolbarShell>
      {showNav ? nav : null}
      {showExplore ? (
        <MapSecondaryToolbarExplore>
          <ExploreToolbar
            categories={categories}
            teaserCategories={teaserCategories}
            activeCategories={activeCategories}
            focusedCategoryId={focusedCategoryId}
            expanded={exploreExpanded}
            onToggleExpanded={onToggleExploreExpanded}
            onToggleCategory={onToggleCategory}
            onSelectCategory={onSelectCategory}
          />
          <ExplorePanelCard
            categoryById={categoryById}
            viewport={exploreViewport}
            entries={exploreEntries}
            isFetching={exploreResultsFetching}
            onGenerateRoutes={onGenerateExploreRoutes}
            onSelectEntry={onSelectExploreEntry}
          />
        </MapSecondaryToolbarExplore>
      ) : null}
    </MapSecondaryToolbarShell>
  );
}
