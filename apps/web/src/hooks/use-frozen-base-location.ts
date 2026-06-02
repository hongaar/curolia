/* eslint-disable react-hooks/set-state-in-effect -- persist last map/blog location for the stack base layer */
import { mapViewHref } from "@/lib/app-paths";
import { applySelectedPinToSearchParams } from "@/lib/map-view-params";
import { isBaseRoute, isStackRoute } from "@/lib/stack-routes";
import { useMap } from "@/providers/map-provider";
import { useLayoutEffect, useMemo, useState } from "react";
import { useLocation, type Location } from "react-router-dom";

function defaultBasePathname(
  activeMapSlug: string | undefined,
  fallbackMapSlug: string | undefined,
): string {
  const slug = activeMapSlug ?? fallbackMapSlug;
  return slug ? mapViewHref("map", slug) : "/map";
}

/** Last map/blog location — kept mounted while stack screens are open. */
export function useFrozenBaseLocation(): Location {
  const location = useLocation();
  const { activeMap, maps } = useMap();
  const fallbackSlug = maps[0]?.slug;
  const defaultPathname = defaultBasePathname(activeMap?.slug, fallbackSlug);

  const [frozenBase, setFrozenBase] = useState(location);

  useLayoutEffect(() => {
    if (isBaseRoute(location.pathname)) {
      setFrozenBase(location);
      return;
    }
    // Stack opened above map — drop ?pin= from frozen base so URL sync on the
    // still-mounted MapPage does not resurrect the side-sheet pin on the map URL.
    if (isStackRoute(location.pathname)) {
      setFrozenBase((prev) => {
        if (!isBaseRoute(prev.pathname)) return prev;
        const nextParams = applySelectedPinToSearchParams(
          new URLSearchParams(prev.search),
          null,
        );
        const q = nextParams.toString();
        const nextSearch = q ? `?${q}` : "";
        if (nextSearch === prev.search) return prev;
        return { ...prev, search: nextSearch };
      });
    }
  }, [location]);

  const fallbackLocation = useMemo(
    (): Location => ({
      ...location,
      pathname: defaultPathname,
      search: "",
      hash: "",
      key: "stack-default-base",
      state: null,
    }),
    [defaultPathname, location],
  );

  if (isBaseRoute(location.pathname)) {
    return location;
  }

  if (isBaseRoute(frozenBase.pathname)) {
    return frozenBase;
  }

  return fallbackLocation;
}
