import { mapViewSwitchHref } from "@/lib/app-paths";
import { mapRouteForMap } from "@/lib/map-route";
import {
  countEnabledMapViews,
  MAP_VIEW_SEGMENTS,
  normalizeMapViewSettings,
} from "@/lib/map-view-settings";
import { isBaseRoute } from "@/lib/stack-routes";
import { useMap } from "@/providers/map-provider";
import {
  SegmentedSwitcher,
  SegmentedSwitcherLink,
} from "@curolia/ui/segmented-switcher";
import { BookOpen, LayoutGrid, Map as MapIcon } from "lucide-react";
import { useLocation } from "react-router-dom";

const VIEW_ICONS = {
  map: <MapIcon />,
  blog: <BookOpen />,
  gallery: <LayoutGrid />,
} as const;

const VIEW_LABELS = {
  map: "Map",
  blog: "Blog",
  gallery: "Gallery",
} as const;

export function MapViewSwitcher() {
  const { pathname, search } = useLocation();
  const { activeMap } = useMap();

  if (
    !activeMap?.owner_profile_slug ||
    !activeMap.slug ||
    !isBaseRoute(pathname)
  ) {
    return null;
  }

  const settings = normalizeMapViewSettings(activeMap);
  const enabledViews = MAP_VIEW_SEGMENTS.filter(
    (view) => settings.enabled[view],
  );
  if (countEnabledMapViews(settings.enabled) <= 1) {
    return null;
  }

  const route = mapRouteForMap(activeMap);

  return (
    <SegmentedSwitcher aria-label="Map view" size="lg" labelMode="container">
      {enabledViews.map((view) => (
        <SegmentedSwitcherLink
          key={view}
          to={mapViewSwitchHref(view, route, search)}
          end
          icon={VIEW_ICONS[view]}
        >
          {VIEW_LABELS[view]}
        </SegmentedSwitcherLink>
      ))}
    </SegmentedSwitcher>
  );
}
