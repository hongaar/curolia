import { supabase, supabaseUrl } from "@/lib/supabase";
import { useEnabledPlugins } from "@/lib/use-enabled-plugins";
import type { MapPlugin } from "@/types/database";
import {
  PageMuted,
  PagePanel,
  PagePanelIcon,
  PagePanelTitleRow,
} from "@curolia/ui/page";
import { useQuery } from "@tanstack/react-query";

type Props = {
  mapId: string;
  isOwner: boolean;
  roleLoading: boolean;
};

/**
 * For each account-level enabled plugin, shows per-map settings. Owners edit; other roles do not see this block.
 */
export function MapPluginsSection({ mapId, isOwner, roleLoading }: Props) {
  const { plugins: implementedEnabled, userPluginsQuery } = useEnabledPlugins({
    queryEnabled: isOwner,
  });

  const mapPluginsQuery = useQuery({
    queryKey: ["map_plugins", mapId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("map_plugins")
        .select("*")
        .eq("map_id", mapId);
      if (error) throw error;
      return (data ?? []) as MapPlugin[];
    },
    enabled: Boolean(mapId) && isOwner,
  });

  if (roleLoading || !isOwner) {
    return null;
  }

  if (userPluginsQuery.isLoading) {
    return (
      <PagePanel>
        <PageMuted>Loading plugins…</PageMuted>
      </PagePanel>
    );
  }

  if (implementedEnabled.length === 0) {
    return (
      <PagePanel>
        <PagePanelTitleRow>Plugins</PagePanelTitleRow>
        <PageMuted>
          Enable integrations under Plugins in the user menu, then configure
          each map here.
        </PageMuted>
      </PagePanel>
    );
  }

  const pluginsWithMapSettings = implementedEnabled.filter(
    (plugin) => plugin.MapSettingsPanel,
  );

  if (pluginsWithMapSettings.length === 0) {
    return null;
  }

  return (
    <>
      {pluginsWithMapSettings.map((plugin) => {
        const Icon = plugin.icon;
        const title =
          plugin.contributions?.mapSettings?.title ?? plugin.displayName;
        const jp = mapPluginsQuery.data?.find(
          (c) => c.plugin_type_id === plugin.id,
        );
        const MapSettingsPanel = plugin.MapSettingsPanel;
        return (
          <PagePanel key={plugin.id} mobileCard>
            <PagePanelTitleRow
              icon={
                <PagePanelIcon>
                  <Icon />
                </PagePanelIcon>
              }
            >
              {title}
            </PagePanelTitleRow>
            <PageMuted>
              {plugin.description ?? "Plugin map settings."}
            </PageMuted>
            {MapSettingsPanel ? (
              <MapSettingsPanel
                supabase={supabase}
                supabaseUrl={supabaseUrl}
                mapId={mapId}
                jp={jp}
                pluginGloballyEnabled
                readOnly={false}
              />
            ) : null}
          </PagePanel>
        );
      })}
    </>
  );
}
