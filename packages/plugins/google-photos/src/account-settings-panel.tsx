import type { PluginAccountPanelProps } from "@curolia/plugin-contract";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@curolia/ui/button";
import {
  PluginAccountBody,
  PluginAccountHeading,
  PluginAccountMuted,
  PluginAccountName,
  PluginAccountPanel,
  PluginAccountRow,
  pluginAccountButtonClass,
} from "@curolia/ui/curolia/plugin-account-ui";
import { toast } from "sonner";

export function GooglePhotosAccountSettingsPanel(
  props: PluginAccountPanelProps,
) {
  const { pluginEnabled, accessToken, userPlugin, onRefresh, oauth } = props;

  const statusQuery = useQuery({
    queryKey: ["plugin_oauth_link_status", props.pluginTypeId, accessToken],
    queryFn: () => oauth!.fetchLinkStatus(),
    enabled: Boolean(oauth && accessToken && pluginEnabled),
  });

  const unlinkMut = useMutation({
    mutationFn: () => oauth!.unlink(),
    onSuccess: async () => {
      toast.success("Google Photos unlinked.");
      await onRefresh();
      await statusQuery.refetch();
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "Could not unlink.");
    },
  });

  async function onLink() {
    if (!oauth) return;
    try {
      await oauth.startOAuth(`${window.location.origin}/settings/plugins`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "OAuth failed");
    }
  }

  if (!oauth) {
    return (
      <PluginAccountPanel compact>
        <PluginAccountMuted>
          OAuth is not configured for this environment.
        </PluginAccountMuted>
      </PluginAccountPanel>
    );
  }

  const linked = statusQuery.data?.linked === true;

  const oauthCfg =
    typeof userPlugin?.config === "object" &&
    userPlugin.config !== null &&
    "oauth" in userPlugin.config &&
    typeof (userPlugin.config as { oauth?: unknown }).oauth === "object" &&
    (userPlugin.config as { oauth: object }).oauth !== null
      ? ((userPlugin.config as { oauth: Record<string, unknown> }).oauth ?? {})
      : null;

  const email =
    statusQuery.data?.email ??
    (oauthCfg && typeof oauthCfg.email === "string" ? oauthCfg.email : null);

  const sub =
    statusQuery.data?.sub ??
    (oauthCfg && typeof oauthCfg.sub === "string" ? oauthCfg.sub : null);

  const accountLabel = email ?? sub;

  return (
    <PluginAccountPanel>
      <PluginAccountHeading>Account</PluginAccountHeading>
      {statusQuery.isLoading ? (
        <PluginAccountMuted>Checking link status…</PluginAccountMuted>
      ) : linked ? (
        <PluginAccountRow>
          <PluginAccountBody>
            Linked as{" "}
            <PluginAccountName>
              {accountLabel ?? "Google account"}
            </PluginAccountName>
          </PluginAccountBody>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={pluginAccountButtonClass}
            disabled={unlinkMut.isPending}
            onClick={() => unlinkMut.mutate()}
          >
            Unlink Google Photos
          </Button>
        </PluginAccountRow>
      ) : (
        <PluginAccountRow gap="sm">
          <PluginAccountMuted>
            Connect your library to search and import photos on traces.
          </PluginAccountMuted>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={pluginAccountButtonClass}
            onClick={() => void onLink()}
          >
            Link Google Photos
          </Button>
        </PluginAccountRow>
      )}
    </PluginAccountPanel>
  );
}
