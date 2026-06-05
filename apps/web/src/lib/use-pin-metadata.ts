import { supabase } from "@/lib/supabase";
import {
  groupPinMetadataForDisplay,
  parsePinMetadataRow,
  type PinMetadataDisplayItem,
  type PinMetadataRow,
} from "@curolia/plugin-contract";
import { useQuery } from "@tanstack/react-query";

export function pinMetadataQueryKey(pinId: string): readonly string[] {
  return ["pin_metadata", pinId] as const;
}

async function fetchPinMetadataRows(pinId: string): Promise<PinMetadataRow[]> {
  const { data, error } = await supabase
    .from("pin_metadata")
    .select(
      "id, map_id, pin_id, field_key, source_plugin_id, value, created_at, updated_at",
    )
    .eq("pin_id", pinId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .map((row) => parsePinMetadataRow(row))
    .filter((row): row is NonNullable<typeof row> => row != null);
}

export function usePinMetadataRows(pinId: string | undefined) {
  return useQuery({
    queryKey: pinMetadataQueryKey(pinId ?? ""),
    queryFn: () => fetchPinMetadataRows(pinId!),
    enabled: Boolean(pinId),
  });
}

export function usePinMetadata(pinId: string | undefined) {
  const query = usePinMetadataRows(pinId);
  return {
    ...query,
    data: query.data ? groupPinMetadataForDisplay(query.data) : undefined,
  } as typeof query & { data: PinMetadataDisplayItem[] | undefined };
}
