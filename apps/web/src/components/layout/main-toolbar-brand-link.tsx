import { mapViewHref } from "@/lib/app-paths";
import { isMapChromeRoute } from "@/lib/map-chrome";
import { mapRouteForMap } from "@/lib/map-route";
import { normalizeMapStylePreset } from "@/lib/map-style";
import { resolveMemberMapHomeHref } from "@/lib/member-map-home";
import { getStoredActiveMapId, useAuth } from "@/providers/auth-provider";
import { useMap } from "@/providers/map-provider";
import {
  MainToolbarBrand,
  MainToolbarBrandAnchor,
} from "@curolia/ui/main-toolbar";
import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function MainToolbarBrandLink() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { activeMap, memberMaps } = useMap();
  const overlayNameTone = isMapChromeRoute(pathname)
    ? (() => {
        const preset = normalizeMapStylePreset(activeMap?.style);
        if (preset === "satellite") return "light" as const;
        if (preset === "street") return "dark" as const;
        return undefined;
      })()
    : undefined;

  const brandTo = useMemo(() => {
    if (!user) return "/";
    if (activeMap?.owner_profile_slug && activeMap.slug.trim()) {
      return mapViewHref("map", mapRouteForMap(activeMap));
    }
    return resolveMemberMapHomeHref(memberMaps, getStoredActiveMapId());
  }, [user, activeMap, memberMaps]);

  const isCurrentHome =
    user && normalizePathname(pathname) === normalizePathname(brandTo);

  return (
    <MainToolbarBrandAnchor>
      {(className) => (
        <Link
          to={brandTo}
          className={className}
          onClick={(event) => {
            if (isCurrentHome) {
              event.preventDefault();
            }
          }}
        >
          <MainToolbarBrand overlayNameTone={overlayNameTone} />
        </Link>
      )}
    </MainToolbarBrandAnchor>
  );
}
