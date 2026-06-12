import type { PinContextProps } from "@curolia/plugin-contract";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { spotifyPluginMeta } from "./plugin-meta";
import { pluginEntityDataRowQueryKey } from "./query-keys";
import { getSpotifyPinItem, parseSpotifyPinPayload } from "./spotify-pin-data";

/** Read-only Spotify selection on a pin (no account plugin gate). */
export function useSpotifyPinDisplay({
  supabase,
  pinId,
}: Pick<PinContextProps, "supabase" | "pinId">) {
  const pid = spotifyPluginMeta.typeId;

  const dataRowQueryKey = useMemo(
    () => pluginEntityDataRowQueryKey(pid, "pin", pinId),
    [pid, pinId],
  );

  const rowQuery = useQuery({
    queryKey: dataRowQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plugin_entity_data")
        .select("data")
        .eq("entity_type", "pin")
        .eq("entity_id", pinId)
        .eq("plugin_type_id", pid)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(pinId),
    placeholderData: keepPreviousData,
  });

  const payload = parseSpotifyPinPayload(rowQuery.data?.data);
  const selected = payload ? getSpotifyPinItem(payload) : null;

  return {
    selected,
    isPending: rowQuery.isPending && !selected,
  };
}
