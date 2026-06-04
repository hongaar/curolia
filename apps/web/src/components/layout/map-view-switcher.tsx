import { mapViewSwitchHref } from "@/lib/app-paths";
import { isBaseRoute } from "@/lib/stack-routes";
import { useMap } from "@/providers/map-provider";
import {
  SegmentedSwitcher,
  SegmentedSwitcherLink,
} from "@curolia/ui/segmented-switcher";
import { BookOpen, Map as MapIcon } from "lucide-react";
import { useLocation } from "react-router-dom";

export function MapViewSwitcher() {
  const { pathname, search } = useLocation();
  const { activeMap } = useMap();
  const slug = activeMap?.slug?.trim();

  if (!slug || !isBaseRoute(pathname)) {
    return null;
  }

  return (
    <SegmentedSwitcher aria-label="Map view">
      <SegmentedSwitcherLink
        to={mapViewSwitchHref("map", slug, search)}
        end
        icon={<MapIcon />}
      >
        Map
      </SegmentedSwitcherLink>
      <SegmentedSwitcherLink
        to={mapViewSwitchHref("blog", slug, search)}
        end
        icon={<BookOpen />}
      >
        Blog
      </SegmentedSwitcherLink>
    </SegmentedSwitcher>
  );
}
