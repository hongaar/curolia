import type { MapSettingsPanelProps } from "@curolia/plugin-contract";
import {
  mapPluginConfigRecord,
  mergeMapPluginConfig,
} from "@curolia/plugin-contract";
import { Checkbox } from "@curolia/ui/checkbox";
import { Label } from "@curolia/ui/label";
import {
  PluginSettingsBox,
  PluginSettingsHint,
  PluginSettingsRow,
  PluginSettingsTitle,
  PluginStatusText,
} from "@curolia/ui/plugin-panel";
import { Switch } from "@curolia/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { OsmPoiMapPluginRow, OsmPoiTagFamily } from "./config";
import {
  isOsmPoiEnabledForMap,
  OSM_POI_PLUGIN_ID,
  resolveOsmPoiTagFamilies,
} from "./config";

const TAG_FAMILY_OPTIONS: {
  id: OsmPoiTagFamily;
  label: string;
  hint: string;
}[] = [
  {
    id: "food",
    label: "Food & drink",
    hint: "Type, cuisine, and diet tags",
  },
  {
    id: "accessibility",
    label: "Accessibility",
    hint: "Wheelchair access and dog-friendly tags",
  },
  {
    id: "outdoor",
    label: "Outdoor & travel",
    hint: "Campsites, fuel, dump stations, and parks",
  },
];

export function OsmPoiMapSettingsPanel({
  supabase,
  mapId,
  jp,
  pluginGloballyEnabled,
  readOnly = false,
}: MapSettingsPanelProps) {
  const qc = useQueryClient();
  const row = jp as OsmPoiMapPluginRow | undefined;
  const enabled = isOsmPoiEnabledForMap(row);
  const tagFamilies = resolveOsmPoiTagFamilies(row);

  const save = useMutation({
    mutationFn: async (patch: {
      enabled?: boolean;
      tagFamilies?: Partial<Record<OsmPoiTagFamily, boolean>>;
    }) => {
      const config = mergeMapPluginConfig(
        OSM_POI_PLUGIN_ID,
        mapPluginConfigRecord(jp),
        {
          ...(patch.tagFamilies
            ? {
                tagFamilies: {
                  ...resolveOsmPoiTagFamilies(row),
                  ...patch.tagFamilies,
                },
              }
            : {}),
        },
      );
      const { error } = await supabase.from("map_plugins").upsert(
        {
          map_id: mapId,
          plugin_type_id: OSM_POI_PLUGIN_ID,
          enabled: patch.enabled ?? enabled,
          config,
          status: "connected",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "map_id,plugin_type_id" },
      );
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["map_plugins", mapId] });
    },
    onError: (e) => {
      toast.error(
        e instanceof Error
          ? e.message
          : "Could not update OpenStreetMap settings",
      );
    },
  });

  return (
    <PluginSettingsBox>
      <PluginSettingsRow>
        <div>
          <PluginSettingsTitle>
            <Label htmlFor="osm-poi-map-enabled">Show OSM place context</Label>
          </PluginSettingsTitle>
          <PluginSettingsHint>
            Pins are enriched from nearby OpenStreetMap features—amenity type,
            cuisine, wheelchair access, and more—in the pin subtitle.
          </PluginSettingsHint>
        </div>
        <Switch
          id="osm-poi-map-enabled"
          checked={enabled}
          disabled={readOnly || save.isPending || !pluginGloballyEnabled}
          onCheckedChange={(c) =>
            void save.mutateAsync({ enabled: c === true })
          }
        />
      </PluginSettingsRow>
      {enabled && pluginGloballyEnabled ? (
        <div>
          <PluginSettingsTitle>Subtitle tag families</PluginSettingsTitle>
          <PluginSettingsHint>
            Choose which OSM tag groups appear on pins for this map.
          </PluginSettingsHint>
          <div>
            {TAG_FAMILY_OPTIONS.map((option) => {
              const inputId = `osm-poi-tag-${option.id}`;
              return (
                <PluginSettingsRow key={option.id}>
                  <div>
                    <PluginSettingsTitle>
                      <Label htmlFor={inputId}>{option.label}</Label>
                    </PluginSettingsTitle>
                    <PluginSettingsHint>{option.hint}</PluginSettingsHint>
                  </div>
                  <Checkbox
                    id={inputId}
                    checked={tagFamilies[option.id]}
                    disabled={readOnly || save.isPending}
                    onCheckedChange={(checked) =>
                      void save.mutateAsync({
                        tagFamilies: { [option.id]: checked === true },
                      })
                    }
                  />
                </PluginSettingsRow>
              );
            })}
          </div>
        </div>
      ) : null}
      {!pluginGloballyEnabled ? (
        <PluginStatusText size="sm">
          Turn on OpenStreetMap under Plugins (user menu) to use place context
          on this map.
        </PluginStatusText>
      ) : null}
    </PluginSettingsBox>
  );
}
