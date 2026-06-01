import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import { pluginList } from "@/plugins/registry";
import { PluginMapSettings } from "@/plugins/map-settings/plugin-map-settings";
import type { MapPlugin, UserPlugin } from "@/types/database";
import {
  PageMuted,
  PagePanel,
  PagePanelIcon,
  PagePanelTitleRow,
} from "@curolia/ui/page";

type Props = {
  mapId: string;
  isOwner: boolean;
  roleLoading: boolean;
};

/**
 * For each account-level enabled plugin, shows per-map settings. Owners edit; other roles do not see this block.
 */
export function MapPluginsSection({ mapId, isOwner, roleLoading }: Props) {
  const { user } = useAuth();

  const userPluginsQuery = useQuery({
    queryKey: ["user_plugins", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_plugins")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data ?? []) as UserPlugin[];
    },
    enabled: Boolean(user) && isOwner,
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

  const enabledTypeIds = new Set(
    (userPluginsQuery.data ?? [])
      .filter((up) => up.enabled)
      .map((up) => up.plugin_type_id),
  );

  const implementedEnabled = pluginList.filter(
    (plugin) => plugin.implemented && enabledTypeIds.has(plugin.id),
  );

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

  return (
    <>
      {implementedEnabled.map((plugin) => {
        const Icon = plugin.icon;
        const title =
          plugin.contributions?.mapSettings?.title ?? plugin.displayName;
        const jp = mapPluginsQuery.data?.find(
          (c) => c.plugin_type_id === plugin.id,
        );
        return (
          <PagePanel key={plugin.id}>
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
            <PluginMapSettings
              pluginTypeId={plugin.id}
              mapId={mapId}
              jp={jp}
              pluginGloballyEnabled
              readOnly={false}
            />
          </PagePanel>
        );
      })}
    </>
  );
}
