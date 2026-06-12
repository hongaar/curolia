import type { PluginDefinition } from "@curolia/plugin-contract";
import { describe, expect, it } from "vitest";

import { getPluginSetupInfo } from "./plugin-setup-status";

function plugin(overrides: Partial<PluginDefinition> = {}): PluginDefinition {
  return {
    id: "test",
    displayName: "Test",
    icon: () => null,
    implemented: true,
    ...overrides,
  };
}

describe("getPluginSetupInfo", () => {
  it("marks unimplemented plugins as unavailable", () => {
    expect(
      getPluginSetupInfo(plugin({ implemented: false }), { enabled: false }),
    ).toMatchObject({
      kind: "unavailable",
      showConfigureIcon: false,
    });
  });

  it("marks disabled plugins as off", () => {
    expect(getPluginSetupInfo(plugin(), { enabled: false })).toMatchObject({
      kind: "disabled",
      showConfigureIcon: false,
    });
  });

  it("requires oauth when enabled and not linked", () => {
    expect(
      getPluginSetupInfo(
        plugin({
          id: "spotify",
          contributions: { oauth: [{ provider: "spotify", scopes: [] }] },
        }),
        {
          enabled: true,
          oauthStatus: {
            linked: false,
            email: null,
            sub: null,
            status: null,
          },
        },
      ),
    ).toMatchObject({
      kind: "needs_oauth",
      primaryAction: "link_account",
      showConfigureIcon: false,
    });
  });

  it("requires last.fm username when missing", () => {
    expect(
      getPluginSetupInfo(
        plugin({ id: "lastfm", AccountSettingsPanel: () => null }),
        {
          enabled: true,
          userConfig: {},
        },
      ),
    ).toMatchObject({
      kind: "needs_username",
      primaryAction: "configure",
      showConfigureIcon: false,
    });
  });

  it("shows configure icon for linked oauth plugins", () => {
    expect(
      getPluginSetupInfo(
        plugin({
          AccountSettingsPanel: () => null,
          contributions: { oauth: [{ provider: "google", scopes: [] }] },
        }),
        {
          enabled: true,
          oauthStatus: {
            linked: true,
            email: "a@b.com",
            sub: null,
            status: null,
          },
        },
      ),
    ).toMatchObject({
      kind: "ready",
      showConfigureIcon: true,
    });
  });
});
