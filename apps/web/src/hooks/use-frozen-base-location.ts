/* eslint-disable react-hooks/set-state-in-effect -- persist last map/blog location for the stack base layer */
import { mapViewHref } from "@/lib/app-paths";
import { mapRouteForMap } from "@/lib/map-route";
import { applySelectedPinToSearchParams } from "@/lib/map-view-params";
import { isBaseRoute, isStackRoute } from "@/lib/stack-routes";
import { useMap } from "@/providers/map-provider";
import {
  createContext,
  createElement,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation, type Location } from "react-router-dom";

const FrozenBaseLocationContext = createContext<Location | null>(null);

function defaultBasePathname(
  activeMap: ReturnType<typeof useMap>["activeMap"],
  fallbackMap: ReturnType<typeof useMap>["maps"][number] | undefined,
): string {
  const map = activeMap ?? fallbackMap;
  if (map?.owner_profile_slug && map.slug) {
    return mapViewHref("map", mapRouteForMap(map));
  }
  return "/";
}

function useFrozenBaseLocationValue(): Location {
  const location = useLocation();
  const { activeMap, maps } = useMap();
  const fallbackMap = maps[0];
  const defaultPathname = defaultBasePathname(activeMap, fallbackMap);

  const [frozenBase, setFrozenBase] = useState(location);

  useLayoutEffect(() => {
    if (isBaseRoute(location.pathname)) {
      setFrozenBase((prev) => {
        if (
          prev.pathname === location.pathname &&
          prev.search === location.search &&
          prev.hash === location.hash
        ) {
          return prev;
        }
        return location;
      });
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

/** Shares one frozen map/blog location across stack layers and back navigation. */
export function FrozenBaseLocationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const value = useFrozenBaseLocationValue();
  return createElement(FrozenBaseLocationContext.Provider, { value }, children);
}

/** Last map/blog location — kept mounted while stack screens are open. */
export function useFrozenBaseLocation(): Location {
  const value = useContext(FrozenBaseLocationContext);
  if (!value) {
    throw new Error(
      "useFrozenBaseLocation must be used within FrozenBaseLocationProvider",
    );
  }
  return value;
}
