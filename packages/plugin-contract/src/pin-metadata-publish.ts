import type { SupabaseClient } from "@supabase/supabase-js";
import type { PinMetadataUpsert } from "./pin-metadata";

export type PublishPinMetadataArgs = {
  pinId: string;
  mapId: string;
  sourcePluginId: string;
  fields: PinMetadataUpsert[];
};

/**
 * Replace all metadata rows from one plugin on a pin.
 * Deletes existing rows for `sourcePluginId`, then inserts `fields`.
 */
export async function replacePinMetadataForSource(
  supabase: SupabaseClient,
  args: PublishPinMetadataArgs,
): Promise<void> {
  const { pinId, mapId, sourcePluginId, fields } = args;

  const { error: deleteErr } = await supabase
    .from("pin_metadata")
    .delete()
    .eq("pin_id", pinId)
    .eq("source_plugin_id", sourcePluginId);
  if (deleteErr) throw deleteErr;

  if (fields.length === 0) return;

  const { error: insertErr } = await supabase.from("pin_metadata").insert(
    fields.map((field) => ({
      pin_id: pinId,
      map_id: mapId,
      field_key: field.fieldKey,
      source_plugin_id: sourcePluginId,
      value: field.value as Record<string, unknown>,
    })),
  );
  if (insertErr) throw insertErr;
}
