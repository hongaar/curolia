import { supabase } from "@/lib/supabase";
import {
  groupPinMetadataForDisplay,
  parsePinMetadataRow,
  type PinMetadataDisplayItem,
} from "@curolia/plugin-contract";
import { useQuery } from "@tanstack/react-query";

export function pinMetadataQueryKey(pinId: string): readonly string[] {
  return ["pin_metadata", pinId] as const;
}

export function usePinMetadata(pinId: string | undefined) {
  return useQuery({
    queryKey: pinMetadataQueryKey(pinId ?? ""),
    queryFn: async (): Promise<PinMetadataDisplayItem[]> => {
      const { data, error } = await supabase
        .from("pin_metadata")
        .select(
          "id, map_id, pin_id, field_key, source_plugin_id, value, created_at, updated_at",
        )
        .eq("pin_id", pinId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? [])
        .map((row) => parsePinMetadataRow(row))
        .filter((row): row is NonNullable<typeof row> => row != null);
      return groupPinMetadataForDisplay(rows);
    },
    enabled: Boolean(pinId),
  });
}
