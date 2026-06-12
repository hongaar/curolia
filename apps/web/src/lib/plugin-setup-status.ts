import type { PluginDefinition } from "@curolia/plugin-contract";

import type { PluginOAuthLinkStatus } from "./plugin-oauth-api";

export type PluginSetupKind =
  | "unavailable"
  | "disabled"
  | "loading"
  | "needs_oauth"
  | "needs_username"
  | "ready";

export type PluginSetupPrimaryAction = "link_account" | "configure";

export type PluginSetupInfo = {
  kind: PluginSetupKind;
  primaryAction?: PluginSetupPrimaryAction;
  primaryActionLabel?: string;
  /** Round configure control on the grid card (hidden when a primary action is shown). */
  showConfigureIcon: boolean;
};

function readLastfmUsername(config: unknown): string {
  if (!config || typeof config !== "object") return "";
  const lf = (config as { lastfm?: unknown }).lastfm;
  if (!lf || typeof lf !== "object") return "";
  const username = (lf as { username?: unknown }).username;
  return typeof username === "string" ? username.trim() : "";
}

function hasOAuth(plugin: PluginDefinition): boolean {
  return Boolean(plugin.contributions?.oauth?.length);
}

export function getPluginSetupInfo(
  plugin: PluginDefinition,
  {
    enabled,
    oauthStatus,
    oauthLoading = false,
    userConfig,
  }: {
    enabled: boolean;
    oauthStatus?: PluginOAuthLinkStatus;
    oauthLoading?: boolean;
    userConfig?: unknown;
  },
): PluginSetupInfo {
  if (!plugin.implemented) {
    return {
      kind: "unavailable",
      showConfigureIcon: false,
    };
  }

  if (!enabled) {
    return {
      kind: "disabled",
      showConfigureIcon: false,
    };
  }

  const hasAccountPanel = Boolean(plugin.AccountSettingsPanel);

  if (hasOAuth(plugin)) {
    if (oauthLoading) {
      return {
        kind: "loading",
        showConfigureIcon: false,
      };
    }

    if (!oauthStatus?.linked) {
      return {
        kind: "needs_oauth",
        primaryAction: "link_account",
        primaryActionLabel: "Link account",
        showConfigureIcon: false,
      };
    }

    return {
      kind: "ready",
      showConfigureIcon: hasAccountPanel,
    };
  }

  if (plugin.id === "lastfm" && !readLastfmUsername(userConfig)) {
    return {
      kind: "needs_username",
      primaryAction: "configure",
      primaryActionLabel: "Set username",
      showConfigureIcon: false,
    };
  }

  return {
    kind: "ready",
    showConfigureIcon: hasAccountPanel,
  };
}
