import type { PinContextProps } from "@curolia/plugin-contract";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import { spotifyPluginMeta } from "./plugin-meta";
import { pluginEntityDataRowQueryKey } from "./query-keys";
import type { SpotifySearchHit } from "./spotify-edge";
import {
  emptySpotifyPinPayload,
  getSpotifyPinItem,
  parseSpotifyPinPayload,
  type SpotifyPinItem,
  type SpotifyPinPayload,
} from "./spotify-pin-data";

export function useSpotifyPinMusic({
  supabase,
  userId,
  mapId,
  pinId,
}: PinContextProps) {
  const qc = useQueryClient();
  const pid = spotifyPluginMeta.typeId;

  const userPluginQuery = useQuery({
    queryKey: ["user_plugins", userId, pid],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("user_plugins")
        .select("enabled, status")
        .eq("user_id", userId)
        .eq("plugin_type_id", pid)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  });

  const pluginReady =
    Boolean(userPluginQuery.data?.enabled) && spotifyPluginMeta.implemented;

  const spotifyLinked =
    pluginReady && userPluginQuery.data?.status === "connected";

  const dataRowQueryKey = useMemo(
    () => pluginEntityDataRowQueryKey(pid, "pin", pinId),
    [pid, pinId],
  );

  const rowQuery = useQuery({
    queryKey: dataRowQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plugin_entity_data")
        .select("data, map_id")
        .eq("entity_type", "pin")
        .eq("entity_id", pinId)
        .eq("plugin_type_id", pid)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: pluginReady,
  });

  const payload =
    parseSpotifyPinPayload(rowQuery.data?.data) ?? emptySpotifyPinPayload();
  const selected = getSpotifyPinItem(payload);
  const mapIdForWrite = rowQuery.data?.map_id ?? mapId;

  async function persistItem(item: SpotifyPinItem | null) {
    if (!item) {
      const { error } = await supabase
        .from("plugin_entity_data")
        .delete()
        .eq("entity_type", "pin")
        .eq("entity_id", pinId)
        .eq("plugin_type_id", pid);
      if (error) throw error;
      return;
    }
    const next: SpotifyPinPayload = { schemaVersion: 2, items: [item] };
    const { error } = await supabase.from("plugin_entity_data").upsert(
      {
        map_id: mapIdForWrite,
        entity_type: "pin",
        entity_id: pinId,
        plugin_type_id: pid,
        data: next as unknown as Record<string, unknown>,
      },
      { onConflict: "entity_type,entity_id,plugin_type_id" },
    );
    if (error) throw error;
  }

  async function invalidateMusicQueries() {
    await qc.invalidateQueries({ queryKey: dataRowQueryKey });
    await qc.invalidateQueries({ queryKey: ["pin-side-sheet", pinId] });
  }

  const setItemMutation = useMutation({
    mutationFn: async (hit: SpotifySearchHit) => {
      const item: SpotifyPinItem = {
        kind: hit.kind,
        spotifyId: hit.spotifyId,
        title: hit.title,
        subtitle: hit.subtitle,
        openUrl: hit.openUrl,
        imageUrl: hit.imageUrl,
        addedAt: new Date().toISOString(),
      };
      await persistItem(item);
    },
    onSuccess: async () => {
      await invalidateMusicQueries();
      toast.success("Spotify updated.");
    },
    onError: (e: unknown) => {
      toast.error(
        e instanceof Error ? e.message : "Could not save Spotify selection.",
      );
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      await persistItem(null);
    },
    onSuccess: async () => {
      await invalidateMusicQueries();
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "Could not clear Spotify.");
    },
  });

  const busy =
    rowQuery.isFetching || setItemMutation.isPending || clearMutation.isPending;

  return {
    supabase,
    pluginReady,
    spotifyLinked,
    selected,
    busy,
    setItemMutation,
    clearMutation,
  };
}
