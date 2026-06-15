import { PageBackButton } from "@/components/layout/page-back-button";
import type { Json } from "@/lib/database.types";
import {
  fetchPluginOAuthLinkStatus,
  unlinkPluginOAuth,
} from "@/lib/plugin-oauth-api";
import { startPluginOAuth } from "@/lib/plugin-oauth-start";
import { getPluginSetupInfo } from "@/lib/plugin-setup-status";
import { supabase } from "@/lib/supabase";
import { pluginList } from "@/plugins/registry";
import { useAuth } from "@/providers/auth-provider";
import type { UserPlugin } from "@/types/database";
import type { PluginDefinition } from "@curolia/plugin-contract";
import { Button } from "@curolia/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@curolia/ui/dialog";
import {
  AppPageLayout,
  PageHeader,
  PageHeaderLead,
  PageHeaderTitle,
  PagePanel,
} from "@curolia/ui/page";
import { PluginAccountPanelProvider } from "@curolia/ui/plugin-account";
import {
  PluginGrid,
  PluginGridCard,
  PluginGridCardActions,
  PluginGridCardConfigureButton,
  PluginGridCardDescription,
  PluginGridCardFooter,
  PluginGridCardFooterRow,
  PluginGridCardHeading,
  PluginGridCardIcon,
  PluginGridCardTitle,
  PluginGridCardToggle,
  PluginGridCardTop,
} from "@curolia/ui/plugins";
import { Stack } from "@curolia/ui/stack";
import { Switch } from "@curolia/ui/switch";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

let oauthRedirectHandledSig = "";

function PluginGridItem({
  plugin,
  up,
  onToggle,
  toggleDisabled,
  oauthStatus,
  oauthLoading,
  onConfigure,
  onLinkAccount,
}: {
  plugin: PluginDefinition;
  up: UserPlugin | undefined;
  onToggle: (enabled: boolean) => void;
  toggleDisabled: boolean;
  oauthStatus?: Awaited<ReturnType<typeof fetchPluginOAuthLinkStatus>>;
  oauthLoading: boolean;
  onConfigure: () => void;
  onLinkAccount: () => void;
}) {
  const Icon = plugin.icon;
  const implemented = plugin.implemented;
  const enabled = up?.enabled ?? false;

  const setup = getPluginSetupInfo(plugin, {
    enabled,
    oauthStatus,
    oauthLoading,
    userConfig: up?.config,
  });

  return (
    <PluginGridCard unavailable={!implemented}>
      <PluginGridCardTop>
        <PluginGridCardIcon>
          <Icon size={5} />
        </PluginGridCardIcon>
        <PluginGridCardHeading>
          <PluginGridCardTitle>{plugin.displayName}</PluginGridCardTitle>
          <PluginGridCardDescription>
            {plugin.description ?? "Plugin integration."}
          </PluginGridCardDescription>
        </PluginGridCardHeading>
        <PluginGridCardToggle>
          <Switch
            id={`sw-${plugin.id}`}
            checked={enabled}
            disabled={!implemented || toggleDisabled}
            aria-label={`Enable ${plugin.displayName}`}
            onCheckedChange={(checked) => {
              if (!implemented) return;
              onToggle(checked === true);
            }}
          />
        </PluginGridCardToggle>
      </PluginGridCardTop>

      <PluginGridCardFooter>
        <PluginGridCardFooterRow>
          <PluginGridCardActions>
            {implemented &&
            enabled &&
            setup.primaryAction === "link_account" ? (
              <Button type="button" size="sm" onClick={() => onLinkAccount()}>
                {setup.primaryActionLabel ?? "Link account"}
              </Button>
            ) : null}
            {implemented && enabled && setup.primaryAction === "configure" ? (
              <Button type="button" size="sm" onClick={() => onConfigure()}>
                {setup.primaryActionLabel ?? "Configure"}
              </Button>
            ) : null}
            {implemented && enabled && setup.showConfigureIcon ? (
              <PluginGridCardConfigureButton onClick={() => onConfigure()} />
            ) : null}
          </PluginGridCardActions>
        </PluginGridCardFooterRow>
      </PluginGridCardFooter>
    </PluginGridCard>
  );
}

function PluginConfigureDialog({
  plugin,
  up,
  open,
  onOpenChange,
  accessToken,
  onRefreshAccountPanels,
  userId,
}: {
  plugin: PluginDefinition | null;
  up: UserPlugin | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessToken: string | null;
  onRefreshAccountPanels: () => Promise<void>;
  userId: string | undefined;
}) {
  const Panel = plugin?.AccountSettingsPanel;

  const oauthHandlers = useMemo(() => {
    if (!plugin) return undefined;
    const hasOAuth = Boolean(plugin.contributions?.oauth?.length);
    if (!hasOAuth || !accessToken) return undefined;
    return {
      fetchLinkStatus: () => fetchPluginOAuthLinkStatus(plugin.id),
      unlink: () => unlinkPluginOAuth(plugin.id),
      startOAuth: (redirectAfter: string) =>
        startPluginOAuth(plugin.id, redirectAfter),
    };
  }, [plugin, accessToken]);

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

  if (!plugin || !Panel) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{plugin.displayName}</DialogTitle>
          <DialogDescription>
            {plugin.description ?? "Plugin integration."}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <PluginAccountPanelProvider plain>
            <Panel
              pluginTypeId={plugin.id}
              pluginEnabled={up?.enabled ?? false}
              userPlugin={userSnapshot}
              accessToken={accessToken}
              onRefresh={onRefreshAccountPanels}
              oauth={oauthHandlers}
              supabase={supabase}
              userId={userId}
            />
          </PluginAccountPanelProvider>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

export function PluginsPage() {
  const { user, session } = useAuth();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [configurePluginId, setConfigurePluginId] = useState<string | null>(
    null,
  );

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

  const oauthPluginIds = useMemo(
    () =>
      pluginList
        .filter(
          (plugin) =>
            plugin.implemented && Boolean(plugin.contributions?.oauth?.length),
        )
        .map((plugin) => plugin.id),
    [],
  );

  const oauthStatusQueries = useQueries({
    queries: oauthPluginIds.map((pluginId) => {
      const enabled =
        userPluginsQuery.data?.find((up) => up.plugin_type_id === pluginId)
          ?.enabled ?? false;
      return {
        queryKey: ["plugin_oauth_link_status", pluginId, session?.access_token],
        queryFn: () => fetchPluginOAuthLinkStatus(pluginId),
        enabled: Boolean(user && session?.access_token && enabled),
      };
    }),
  });

  const oauthStatusByPluginId = useMemo(() => {
    const map = new Map<
      string,
      {
        data?: Awaited<ReturnType<typeof fetchPluginOAuthLinkStatus>>;
        isLoading: boolean;
      }
    >();
    oauthPluginIds.forEach((pluginId, index) => {
      const query = oauthStatusQueries[index];
      map.set(pluginId, {
        data: query?.data,
        isLoading: query?.isLoading ?? false,
      });
    });
    return map;
  }, [oauthPluginIds, oauthStatusQueries]);

  const configurePlugin = useMemo(
    () => pluginList.find((plugin) => plugin.id === configurePluginId) ?? null,
    [configurePluginId],
  );

  const configureUserPlugin = userPluginsQuery.data?.find(
    (up) => up.plugin_type_id === configurePluginId,
  );

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

  async function onLinkAccount(pluginId: string) {
    try {
      await startPluginOAuth(pluginId, `${window.location.origin}/plugins`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not start linking.");
    }
  }

  return (
    <AppPageLayout width="2xl" toolbar={<PageBackButton />}>
      <PagePanel>
        <Stack gap="md">
          <PageHeader>
            <PageHeaderTitle>Plugins</PageHeaderTitle>
            <PageHeaderLead>
              Choose which integrations are available for your account. Enable a
              plugin from the grid, link accounts when needed, and open
              Configure for additional options. Map-specific settings live in
              each map&apos;s settings.
            </PageHeaderLead>
          </PageHeader>
          <PluginGrid>
            {pluginList.map((plugin) => {
              const up = userPluginsQuery.data?.find(
                (c) => c.plugin_type_id === plugin.id,
              );
              const oauthQuery = oauthStatusByPluginId.get(plugin.id);
              return (
                <PluginGridItem
                  key={plugin.id}
                  plugin={plugin}
                  up={up}
                  onToggle={(enabled) => void toggle(plugin.id, enabled)}
                  toggleDisabled={!user || userPluginsQuery.isLoading}
                  oauthStatus={oauthQuery?.data}
                  oauthLoading={oauthQuery?.isLoading ?? false}
                  onConfigure={() => setConfigurePluginId(plugin.id)}
                  onLinkAccount={() => void onLinkAccount(plugin.id)}
                />
              );
            })}
          </PluginGrid>
        </Stack>
      </PagePanel>

      <PluginConfigureDialog
        plugin={configurePlugin}
        up={configureUserPlugin}
        open={configurePluginId !== null}
        onOpenChange={(open) => {
          if (!open) setConfigurePluginId(null);
        }}
        accessToken={session?.access_token ?? null}
        onRefreshAccountPanels={onRefreshAccountPanels}
        userId={user?.id}
      />
    </AppPageLayout>
  );
}
