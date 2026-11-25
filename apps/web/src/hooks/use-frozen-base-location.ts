/* eslint-disable react-hooks/set-state-in-effect -- persist last map/blog location for the stack base layer */
import { mapViewHref } from "@/lib/app-paths";
import { rememberHistoryIndex } from "@/lib/history-index";
import { mapRouteForMap } from "@/lib/map-route";
import { applySelectedPinToSearchParams } from "@/lib/map-view-params";
import { isBaseRoute, isStackRoute } from "@/lib/stack-routes";
import { useMap } from "@/providers/map-context";
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

interface FrozenBaseLocationValue {
  location: Location;
  /** No map/blog was visited this session; `location` is only a back target. */
  isFallback: boolean;
}

const FrozenBaseLocationContext = createContext<FrozenBaseLocationValue | null>(
  null,
);

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

function useFrozenBaseLocationValue(): FrozenBaseLocationValue {
  const location = useLocation();
  const { activeMap, maps } = useMap();
  const fallbackMap = maps[0];
  const defaultPathname = defaultBasePathname(activeMap, fallbackMap);

  const [frozenBase, setFrozenBase] = useState(location);

  useLayoutEffect(() => {
    if (isBaseRoute(location.pathname)) {
      rememberHistoryIndex(location.key);
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
    // Stack opened above map — drop ?pin= and the panel pin hash from the frozen
    // base so the still-mounted MapPage does not resurrect the side sheet or keep
    // scrolling/highlighting a blog pin under the stack screen.
    if (isStackRoute(location.pathname)) {
      setFrozenBase((prev) => {
        if (!isBaseRoute(prev.pathname)) return prev;
        const nextParams = applySelectedPinToSearchParams(
          new URLSearchParams(prev.search),
          null,
        );
        const q = nextParams.toString();
        const nextSearch = q ? `?${q}` : "";
        if (nextSearch === prev.search && prev.hash === "") return prev;
        return { ...prev, search: nextSearch, hash: "" };
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

  return useMemo(() => {
    if (isBaseRoute(location.pathname)) {
      return { location, isFallback: false };
    }
    if (isBaseRoute(frozenBase.pathname)) {
      return { location: frozenBase, isFallback: false };
    }
    return { location: fallbackLocation, isFallback: true };
  }, [fallbackLocation, frozenBase, location]);
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

function useFrozenBaseLocationContext(): FrozenBaseLocationValue {
  const value = useContext(FrozenBaseLocationContext);
  if (!value) {
    throw new Error(
      "useFrozenBaseLocation must be used within FrozenBaseLocationProvider",
    );
  }
  return value;
}

/** Last map/blog location (or the default map as a back target on cold stack loads). */
export function useFrozenBaseLocation(): Location {
  return useFrozenBaseLocationContext().location;
}

/** Whether a map/blog location was actually visited and should stay mounted under stack screens. */
export function useHasVisitedBaseLocation(): boolean {
  return !useFrozenBaseLocationContext().isFallback;
}
