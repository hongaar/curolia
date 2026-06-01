/* eslint-disable react-refresh/only-export-components -- Provider module also exports useMap */
/* eslint-disable react-hooks/set-state-in-effect -- hydrate active map from storage/profile when maps load */
import {
  defaultMapIcon,
  normalizeMapIconForPersist,
} from "@/lib/map-display-icon";
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
import {
  getStoredActiveMapId,
  setStoredActiveMapId,
  useAuth,
} from "./auth-provider";

type MapContextValue = {
  maps: CuroliaMap[];
  activeMap: CuroliaMap | null;
  activeMapId: string | null;
  setActiveMapId: (id: string) => void;
  loading: boolean;
  refetch: () => Promise<void>;
  createMap: (
    name: string,
    iconEmoji?: string | null,
  ) => Promise<{ map: CuroliaMap | null; error: Error | null }>;
};

const MapContext = createContext<MapContextValue | null>(null);

async function fetchMapsForUser(userId: string): Promise<CuroliaMap[]> {
  const { data, error } = await supabase
    .from("map_members")
    .select("map_id, maps(*)")
    .eq("user_id", userId);

  if (error) throw error;
  const rows = (data ?? []) as unknown as {
    map_id: string;
    maps: CuroliaMap | null;
  }[];
  return rows.map((r) => r.maps).filter((j): j is CuroliaMap => Boolean(j));
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

export function MapProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeMapId, setActiveMapIdState] = useState<string | null>(null);

  const mapsQuery = useQuery({
    queryKey: ["maps", user?.id],
    queryFn: async () => {
      if (!user) return [];
      return fetchMapsForUser(user.id);
    },
    enabled: Boolean(user) && !authLoading,
  });

  const maps = useMemo(() => mapsQuery.data ?? [], [mapsQuery.data]);

  useEffect(() => {
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
  }, [user, maps]);

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
        iconEmoji ?? defaultMapIcon(false),
        false,
      );
      const { data: map, error: jErr } = await supabase
        .from("maps")
        .insert({
          name,
          created_by_user_id: user.id,
          is_personal: false,
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

  const value = useMemo<MapContextValue>(
    () => ({
      maps,
      activeMap,
      activeMapId,
      setActiveMapId,
      loading:
        authLoading ||
        mapsQuery.isPending ||
        (maps.length > 0 && activeMapId === null),
      refetch: async () => {
        await mapsQuery.refetch();
      },
      createMap,
    }),
    [
      maps,
      activeMap,
      activeMapId,
      setActiveMapId,
      mapsQuery,
      authLoading,
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
