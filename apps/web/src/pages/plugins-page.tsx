import { PageBackButton } from "@/components/layout/page-back-button";
import type { Json } from "@/lib/database.types";
import {
  fetchPluginOAuthLinkStatus,
  unlinkPluginOAuth,
} from "@/lib/plugin-oauth-api";
import { startPluginOAuth } from "@/lib/plugin-oauth-start";
import { supabase } from "@/lib/supabase";
import { pluginList } from "@/plugins/registry";
import { useAuth } from "@/providers/auth-provider";
import type { UserPlugin } from "@/types/database";
import type { PluginDefinition } from "@curolia/plugin-contract";
import {
  AppPageLayout,
  PageDisplayTitle,
  PageLead,
  PagePanel,
} from "@curolia/ui/page";
import {
  PluginListHeader,
  PluginListIcon,
  PluginListRow,
  PluginListRowDescription,
  PluginListRowHint,
  PluginListRowInfo,
  PluginListRowMain,
  PluginListRowTitle,
  PluginListRowToggle,
} from "@curolia/ui/plugins";
import { Switch } from "@curolia/ui/switch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

let oauthRedirectHandledSig = "";

function PluginRow({
  plugin,
  up,
  onToggle,
  toggleDisabled,
  accessToken,
  onRefreshAccountPanels,
  userId,
}: {
  plugin: PluginDefinition;
  up: UserPlugin | undefined;
  onToggle: (enabled: boolean) => void;
  toggleDisabled: boolean;
  accessToken: string | null;
  onRefreshAccountPanels: () => Promise<void>;
  userId: string | undefined;
}) {
  const Icon = plugin.icon;
  const implemented = plugin.implemented;
  const enabled = up?.enabled ?? false;
  const Panel = plugin.AccountSettingsPanel;

  const oauthHandlers = useMemo(() => {
    const hasOAuth = Boolean(plugin.contributions?.oauth?.length);
    if (!hasOAuth || !accessToken) return undefined;
    return {
      fetchLinkStatus: () => fetchPluginOAuthLinkStatus(plugin.id),
      unlink: () => unlinkPluginOAuth(plugin.id),
      startOAuth: (redirectAfter: string) =>
        startPluginOAuth(plugin.id, redirectAfter),
    };
  }, [plugin.contributions?.oauth?.length, plugin.id, accessToken]);

  const userSnapshot = useMemo(
    () =>
      up
        ? {
            enabled: up.enabled,
            status: up.status,
            config: up.config,
          }
        : undefined,
    [up],
  );

  return (
    <PluginListRow>
      <PluginListRowMain>
        <PluginListRowInfo>
          <PluginListRowTitle
            icon={
              <PluginListIcon>
                <Icon size={4} />
              </PluginListIcon>
            }
          >
            {plugin.displayName}
          </PluginListRowTitle>
          <PluginListRowDescription>
            {plugin.description ?? "Plugin integration."}
          </PluginListRowDescription>
          {!implemented ? (
            <PluginListRowHint>
              Sync and linking are not implemented yet.
            </PluginListRowHint>
          ) : null}
        </PluginListRowInfo>
        <PluginListRowToggle
          label="Enabled"
          control={
            <Switch
              id={`sw-${plugin.id}`}
              checked={enabled}
              disabled={!implemented || toggleDisabled}
              onCheckedChange={(c) => {
                if (!implemented) return;
                onToggle(c === true);
              }}
            />
          }
        />
      </PluginListRowMain>

      {Panel && implemented && enabled ? (
        <Panel
          pluginTypeId={plugin.id}
          pluginEnabled={enabled}
          userPlugin={userSnapshot}
          accessToken={accessToken}
          onRefresh={onRefreshAccountPanels}
          oauth={oauthHandlers}
          supabase={supabase}
          userId={userId}
        />
      ) : null}
    </PluginListRow>
  );
}

export function PluginsPage() {
  const { user, session } = useAuth();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const status = searchParams.get("plugin_oauth");
    if (!status) {
      oauthRedirectHandledSig = "";
      return;
    }

    const sig = `${status}:${searchParams.get("reason") ?? ""}:${searchParams.toString()}`;
    const duplicateStrictPass = sig === oauthRedirectHandledSig;

    const finishRedirect = () => {
      const next = new URLSearchParams(searchParams);
      next.delete("plugin_oauth");
      next.delete("reason");
      setSearchParams(next, { replace: true });
      void qc.invalidateQueries({ queryKey: ["user_plugins", user?.id] });
      void qc.invalidateQueries({
        queryKey: ["plugin_oauth_link_status"],
        exact: false,
      });
    };

    if (duplicateStrictPass) {
      finishRedirect();
      return;
    }
    oauthRedirectHandledSig = sig;

    const reason = searchParams.get("reason");
    if (status === "success") {
      toast.success("Account linked.");
    } else if (status === "error") {
      toast.error(
        reason
          ? `Could not complete linking (${reason}).`
          : "Could not complete linking.",
      );
    }
    finishRedirect();
  }, [searchParams, setSearchParams, qc, user?.id]);

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
    enabled: Boolean(user),
  });

  async function toggle(pluginTypeId: string, enabled: boolean) {
    if (!user) return;
    const up = userPluginsQuery.data?.find(
      (c) => c.plugin_type_id === pluginTypeId,
    );
    const existingConfig = (up?.config ?? {}) as Json;
    const { error } = await supabase.from("user_plugins").upsert(
      {
        user_id: user.id,
        plugin_type_id: pluginTypeId,
        enabled,
        config: existingConfig,
        status: enabled ? (up?.status ?? "pending") : "disabled",
      },
      { onConflict: "user_id,plugin_type_id" },
    );
    if (!error) {
      await qc.invalidateQueries({ queryKey: ["user_plugins", user.id] });
      await qc.invalidateQueries({
        queryKey: ["plugin_oauth_link_status"],
        exact: false,
      });
    }
  }

  async function onRefreshAccountPanels() {
    await qc.invalidateQueries({ queryKey: ["user_plugins", user?.id] });
    await qc.invalidateQueries({
      queryKey: ["plugin_oauth_link_status"],
      exact: false,
    });
  }

  return (
    <AppPageLayout width="2xl">
      <PageBackButton />
      <PagePanel>
        <PluginListHeader>
          <PageDisplayTitle>Plugins</PageDisplayTitle>
          <PageLead>
            Choose which integrations are available for your account (for
            example signing in to Google Photos). Journal-specific options—such
            as publishing an iCalendar feed—are configured in each
            journal&apos;s settings.
          </PageLead>
        </PluginListHeader>
        <div>
          {pluginList.map((plugin) => {
            const up = userPluginsQuery.data?.find(
              (c) => c.plugin_type_id === plugin.id,
            );
            return (
              <PluginRow
                key={plugin.id}
                plugin={plugin}
                up={up}
                onToggle={(en) => void toggle(plugin.id, en)}
                toggleDisabled={!user || userPluginsQuery.isLoading}
                accessToken={session?.access_token ?? null}
                onRefreshAccountPanels={onRefreshAccountPanels}
                userId={user?.id}
              />
            );
          })}
        </div>
      </PagePanel>
    </AppPageLayout>
  );
}
