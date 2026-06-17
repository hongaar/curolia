import { mapViewSwitchHref } from "@/lib/app-paths";
import { mapRouteForMap } from "@/lib/map-route";
import { isBaseRoute } from "@/lib/stack-routes";
import { useMap } from "@/providers/map-provider";
import {
  SegmentedSwitcher,
  SegmentedSwitcherLink,
} from "@curolia/ui/segmented-switcher";
import { BookOpen, LayoutGrid, Map as MapIcon } from "lucide-react";
import { useLocation } from "react-router-dom";

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

  const route = mapRouteForMap(activeMap);

  return (
    <SegmentedSwitcher aria-label="Map view" size="lg" labelMode="container">
      <SegmentedSwitcherLink
        to={mapViewSwitchHref("map", route, search)}
        end
        icon={<MapIcon />}
      >
        Map
      </SegmentedSwitcherLink>
      <SegmentedSwitcherLink
        to={mapViewSwitchHref("blog", route, search)}
        end
        icon={<BookOpen />}
      >
        Blog
      </SegmentedSwitcherLink>
      <SegmentedSwitcherLink
        to={mapViewSwitchHref("gallery", route, search)}
        end
        icon={<LayoutGrid />}
      >
        Gallery
      </SegmentedSwitcherLink>
    </SegmentedSwitcher>
  );
}
