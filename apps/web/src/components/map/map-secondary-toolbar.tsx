import { MapViewSwitcher } from "@/components/layout/map-view-switcher";
import { ExploreToolbar } from "@/components/map/explore-categories";
import { MapPicker } from "@/components/map/map-picker";
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
  activeCategories,
  exploreExpanded,
  onToggleExploreExpanded,
  onToggleCategory,
}: {
  activeCategories: readonly ExploreCategoryId[];
  exploreExpanded: boolean;
  onToggleExploreExpanded: () => void;
  onToggleCategory: (categoryId: ExploreCategoryId) => void;
}) {
  const { user } = useAuth();
  const { activeMap, publicView } = useMap();

  return (
    <MapSecondaryToolbarShell>
      <MapSecondaryToolbarNav>
        {user ? (
          <MapPicker />
        ) : publicView && activeMap ? (
          <PublicMapToolbarInfo
            mapEmoji={activeMap.icon_emoji ?? defaultMapIcon()}
            mapName={activeMap.name.trim() || "Map"}
          />
        ) : null}
        <MapViewSwitcher size="default" labelMode="viewport" />
      </MapSecondaryToolbarNav>

      <MapSecondaryToolbarExplore>
        <ExploreToolbar
          activeCategories={activeCategories}
          expanded={exploreExpanded}
          onToggleExpanded={onToggleExploreExpanded}
          onToggleCategory={onToggleCategory}
        />
      </MapSecondaryToolbarExplore>
    </MapSecondaryToolbarShell>
  );
}
