import type { PinContextProps } from "@curolia/plugin-contract";
import {
  PluginPinCard,
  PluginPinContent,
  PluginPinHeader,
  PluginPinTitleRow,
} from "@curolia/ui/plugin-pin";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { WikidataIcon } from "./icon";
import { wikidataPluginMeta } from "./plugin-meta";
import { pluginEntityDataRowQueryKey } from "./query-keys";
import { useWikidataPluginReady } from "./use-wikidata-plugin-ready";
import { WikidataEnrichmentBody } from "./wikidata-enrichment-body";
import { parseWikidataPinPayload } from "./wikidata-pin-data";

export function WikidataPinDetailSection({
  supabase,
  userId,
  mapId,
  pinId,
}: PinContextProps) {
  const pid = wikidataPluginMeta.typeId;
  const { pluginReady } = useWikidataPluginReady(supabase, { userId, mapId });

  const dataRowQueryKey = useMemo(
    () => pluginEntityDataRowQueryKey(pid, "pin", pinId),
    [pid, pinId],
  );

  const rowQuery = useQuery({
    queryKey: dataRowQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plugin_entity_data")
        .select("data, updated_at")
        .eq("entity_type", "pin")
        .eq("entity_id", pinId)
        .eq("plugin_type_id", pid)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: pluginReady,
  });

  const payload = parseWikidataPinPayload(rowQuery.data?.data);

  if (!pluginReady || !payload) return null;

  return (
    <PluginPinCard>
      <PluginPinHeader>
        <PluginPinTitleRow icon={<WikidataIcon />} title="Wikipedia" />
      </PluginPinHeader>
      <PluginPinContent>
        <WikidataEnrichmentBody
          payload={payload}
          busy={false}
          errorMessage={null}
          emptyMessage=""
        />
      </PluginPinContent>
    </PluginPinCard>
  );
}
