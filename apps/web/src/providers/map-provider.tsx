/* eslint-disable react-refresh/only-export-components -- Provider module also exports useMap */
/* eslint-disable react-hooks/set-state-in-effect -- hydrate active map from storage/profile when maps load */
import type { MapWithOwnerSlug } from "@/lib/app-paths";
import {
  defaultMapIcon,
  normalizeMapIconForPersist,
} from "@/lib/map-display-icon";
import {
  attachOwnerProfileSlugs,
  fetchOwnerProfileSlugs,
  parseMapRoutePathname,
} from "@/lib/map-route";
import { resolveMapByOwnerSlug } from "@/lib/resolve-map-slug";
import { resolveProfileBySlug } from "@/lib/resolve-profile-slug";
import { supabase } from "@/lib/supabase";
import type { CuroliaMap } from "@/types/database";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import {
  getStoredActiveMapId,
  setStoredActiveMapId,
  useAuth,
} from "./auth-provider";

export type RouteMapStatus = "none" | "loading" | "ready" | "unavailable";

type MapContextValue = {
  maps: MapWithOwnerSlug[];
  activeMap: MapWithOwnerSlug | null;
  activeMapId: string | null;
  setActiveMapId: (id: string) => void;
  loading: boolean;
  routeMapStatus: RouteMapStatus;
  publicView: boolean;
  refetch: () => Promise<void>;
  createMap: (
    name: string,
    iconEmoji?: string | null,
  ) => Promise<{ map: CuroliaMap | null; error: Error | null }>;
};

const MapContext = createContext<MapContextValue | null>(null);

async function fetchMapsForUser(userId: string): Promise<MapWithOwnerSlug[]> {
  const { data, error } = await supabase
    .from("map_members")
    .select("map_id, maps(*)")
    .eq("user_id", userId);

  if (error) throw error;
  const rows = (data ?? []) as unknown as {
    map_id: string;
    maps: CuroliaMap | null;
  }[];
  const maps = rows
    .map((r) => r.maps)
    .filter((j): j is CuroliaMap => Boolean(j));
  const slugByOwner = await fetchOwnerProfileSlugs(
    maps.map((map) => map.created_by_user_id),
  );
  return attachOwnerProfileSlugs(maps, slugByOwner);
}

async function fetchPublicMapByRoute(
  profileSlug: string,
  mapSlug: string,
): Promise<MapWithOwnerSlug | null> {
  const profile = await resolveProfileBySlug(profileSlug);
  if (!profile) return null;

  const mapMatch = await resolveMapByOwnerSlug(profile.profileId, mapSlug);
  if (!mapMatch) return null;

  const { data, error } = await supabase
    .from("maps")
    .select("*")
    .eq("id", mapMatch.mapId)
    .eq("is_public", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    ...(data as CuroliaMap),
    owner_profile_slug: profile.canonicalSlug,
  };
}

async function fetchProfileDefaultMap(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("default_map_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.default_map_id ?? null;
}

export function MapProvider({
  children,
  publicView = false,
}: {
  children: ReactNode;
  publicView?: boolean;
}) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeMapId, setActiveMapIdState] = useState<string | null>(null);

  const routePath = useMemo(
    () => parseMapRoutePathname(location.pathname),
    [location.pathname],
  );

  const memberMapsQuery = useQuery({
    queryKey: ["maps", user?.id],
    queryFn: async () => {
      if (!user) return [];
      return fetchMapsForUser(user.id);
    },
    enabled: Boolean(user) && !authLoading,
  });

  const memberMaps = useMemo(
    () => memberMapsQuery.data ?? [],
    [memberMapsQuery.data],
  );

  const routeKey = routePath
    ? `${routePath.profileSlug}/${routePath.mapSlug}`
    : null;

  const memberHasRouteMap = useMemo(() => {
    if (!routePath) return false;
    const profileNeedle = routePath.profileSlug.trim().toLowerCase();
    const mapNeedle = routePath.mapSlug.trim().toLowerCase();
    return memberMaps.some(
      (m) =>
        m.owner_profile_slug.trim().toLowerCase() === profileNeedle &&
        m.slug.trim().toLowerCase() === mapNeedle,
    );
  }, [memberMaps, routePath]);

  const needsPublicMap =
    Boolean(routePath) && (publicView || !memberHasRouteMap);

  const publicMapQuery = useQuery({
    queryKey: ["public_map", routeKey],
    queryFn: async () => {
      if (!routePath) return null;
      return fetchPublicMapByRoute(routePath.profileSlug, routePath.mapSlug);
    },
    enabled: needsPublicMap,
  });

  const maps = useMemo(() => {
    const pub = publicMapQuery.data;
    if (!pub) return memberMaps;
    if (memberMaps.some((m) => m.id === pub.id)) return memberMaps;
    return [...memberMaps, pub];
  }, [memberMaps, publicMapQuery.data]);

  const resolvedRouteMap = useMemo(() => {
    if (!routePath) return null;
    const profileNeedle = routePath.profileSlug.trim().toLowerCase();
    const mapNeedle = routePath.mapSlug.trim().toLowerCase();
    return (
      maps.find(
        (m) =>
          m.owner_profile_slug.trim().toLowerCase() === profileNeedle &&
          m.slug.trim().toLowerCase() === mapNeedle,
      ) ?? null
    );
  }, [maps, routePath]);

  const routeMapStatus = useMemo((): RouteMapStatus => {
    if (!routePath) return "none";
    if (resolvedRouteMap) return "ready";
    if (publicView) {
      if (publicMapQuery.isPending) return "loading";
      return "unavailable";
    }
    if (memberMapsQuery.isPending) return "loading";
    if (needsPublicMap && publicMapQuery.isPending) return "loading";
    return "unavailable";
  }, [
    routePath,
    resolvedRouteMap,
    publicView,
    publicMapQuery.isPending,
    memberMapsQuery.isPending,
    needsPublicMap,
  ]);

  useEffect(() => {
    if (publicView) {
      if (publicMapQuery.data) {
        setActiveMapIdState(publicMapQuery.data.id);
      } else if (!publicMapQuery.isPending && routePath) {
        setActiveMapIdState(null);
      }
      return;
    }

    if (routePath) {
      if (resolvedRouteMap) {
        setActiveMapIdState(resolvedRouteMap.id);
        setStoredActiveMapId(resolvedRouteMap.id);
        return;
      }
      if (routeMapStatus === "unavailable") {
        setActiveMapIdState(null);
      }
      return;
    }

    if (!user || maps.length === 0) {
      setActiveMapIdState(null);
      return;
    }
    const stored = getStoredActiveMapId();
    if (stored && maps.some((j) => j.id === stored)) {
      setActiveMapIdState(stored);
      return;
    }
    void (async () => {
      try {
        const def = await fetchProfileDefaultMap(user.id);
        if (def && maps.some((j) => j.id === def)) {
          setActiveMapIdState(def);
          setStoredActiveMapId(def);
          return;
        }
      } catch {
        /* fall through */
      }
      const first = maps[0];
      if (first) {
        setActiveMapIdState(first.id);
        setStoredActiveMapId(first.id);
      }
    })();
  }, [
    user,
    maps,
    publicView,
    publicMapQuery.data,
    publicMapQuery.isPending,
    routePath,
    resolvedRouteMap,
    routeMapStatus,
  ]);

  const setActiveMapId = useCallback((id: string) => {
    setActiveMapIdState(id);
    setStoredActiveMapId(id);
  }, []);

  const activeMap = useMemo(
    () => maps.find((j) => j.id === activeMapId) ?? null,
    [maps, activeMapId],
  );

  const createMap = useCallback(
    async (name: string, iconEmoji?: string | null) => {
      if (!user) return { map: null, error: new Error("Not signed in") };
      const icon_emoji = normalizeMapIconForPersist(
        iconEmoji ?? defaultMapIcon(),
      );
      const { data: map, error: jErr } = await supabase
        .from("maps")
        .insert({
          name,
          created_by_user_id: user.id,
          icon_emoji,
        })
        .select()
        .single();
      if (jErr || !map) return { map: null, error: jErr as Error };

      const { error: mErr } = await supabase.from("map_members").insert({
        map_id: map.id,
        user_id: user.id,
        role: "owner",
      });
      if (mErr) return { map: null, error: mErr as Error };

      await queryClient.invalidateQueries({ queryKey: ["maps", user.id] });
      setActiveMapId(map.id);
      return { map, error: null };
    },
    [user, queryClient, setActiveMapId],
  );

  const loading = useMemo(() => {
    if (publicView) {
      return routePath ? routeMapStatus === "loading" : false;
    }
    if (authLoading) return true;
    if (memberMapsQuery.isPending) return true;
    if (routePath) {
      return routeMapStatus === "loading";
    }
    return maps.length > 0 && activeMapId === null;
  }, [
    publicView,
    routePath,
    routeMapStatus,
    authLoading,
    memberMapsQuery.isPending,
    maps.length,
    activeMapId,
  ]);

  const value = useMemo<MapContextValue>(
    () => ({
      maps,
      activeMap,
      activeMapId,
      setActiveMapId,
      loading,
      routeMapStatus,
      publicView,
      refetch: async () => {
        await memberMapsQuery.refetch();
        if (needsPublicMap) await publicMapQuery.refetch();
      },
      createMap,
    }),
    [
      maps,
      activeMap,
      activeMapId,
      setActiveMapId,
      loading,
      routeMapStatus,
      publicView,
      memberMapsQuery,
      publicMapQuery,
      needsPublicMap,
      createMap,
    ],
  );

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

export function useMap() {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMap must be used within MapProvider");
  return ctx;
}
