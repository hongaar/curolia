import { MapViewSwitcher } from "@/components/layout/map-view-switcher";
import { ExploreToolbar } from "@/components/map/explore-categories";
import { ExplorePanelCard } from "@/components/map/explore-panel-card";
import { MapPicker } from "@/components/map/map-picker";
import { MapQuickSettingsTrigger } from "@/components/map/map-quick-settings-trigger";
import { useExploreCategories } from "@/hooks/use-explore-categories";
import type { ExploreCategoryId } from "@/lib/explore-categories";
import { defaultMapIcon } from "@/lib/map-display-icon";
import { useAuth } from "@/providers/auth-provider";
import { useMap } from "@/providers/map-provider";
import {
  MapSecondaryToolbarExplore,
  MapSecondaryToolbarNav,
  MapSecondaryToolbarShell,
} from "@curolia/ui/map";
import { PublicMapToolbarInfo } from "@curolia/ui/map-picker";

export function MapSecondaryToolbar({
  placement = "top-left",
  activeCategories,
  focusedCategoryId,
  exploreExpanded,
  onToggleExploreExpanded,
  onToggleCategory,
  onSelectCategory,
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
  quickSettingsOpen?: boolean;
  onQuickSettingsClick?: () => void;
  showQuickSettings?: boolean;
}) {
  const { user } = useAuth();
  const { activeMap, publicView } = useMap();
  const { categories, teaserCategories, categoryById } = useExploreCategories();
  const condensed = placement === "bottom-center";
  const pickerDensity = condensed ? "compact" : "auto";

  const showExplore =
    !condensed &&
    (categories.length > 0 ||
      (focusedCategoryId != null && categoryById(focusedCategoryId) != null));

  const nav = (
    <MapSecondaryToolbarNav placement={placement}>
      {user ? (
        <MapPicker density={pickerDensity} />
      ) : publicView && activeMap ? (
        <PublicMapToolbarInfo
          density={pickerDensity}
          mapEmoji={activeMap.icon_emoji ?? defaultMapIcon()}
          mapName={activeMap.name.trim() || "Map"}
        />
      ) : null}
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
      {nav}
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
          <ExplorePanelCard categoryById={categoryById} />
        </MapSecondaryToolbarExplore>
      ) : null}
    </MapSecondaryToolbarShell>
  );
}
