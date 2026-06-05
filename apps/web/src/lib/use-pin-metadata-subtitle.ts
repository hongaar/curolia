import { supabase } from "@/lib/supabase";
import { usePinMetadataRows } from "@/lib/use-pin-metadata";
import {
  pinMetadataSubtitleFromRows,
  resolveMapPinMetadataShow,
  type PinMetadataSubtitle,
} from "@curolia/plugin-contract";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export type UsePinMetadataSubtitleArgs = {
  pinId: string | undefined;
  mapId: string | null | undefined;
};

export function usePinMetadataSubtitle({
  pinId,
  mapId,
}: UsePinMetadataSubtitleArgs): PinMetadataSubtitle | null {
  const rowsQuery = usePinMetadataRows(pinId);

  const showMetadataQuery = useQuery({
    queryKey: ["maps", mapId, "show_pin_metadata"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maps")
        .select("show_pin_metadata")
        .eq("id", mapId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(mapId),
  });

  return useMemo(() => {
    if (!rowsQuery.data) return null;
    const showSettings = resolveMapPinMetadataShow(
      showMetadataQuery.data?.show_pin_metadata,
    );
    return pinMetadataSubtitleFromRows(rowsQuery.data, showSettings);
  }, [rowsQuery.data, showMetadataQuery.data]);
}
