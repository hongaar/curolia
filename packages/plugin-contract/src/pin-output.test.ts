import { describe, expect, it } from "vitest";
import type { PluginDefinition } from "./definition";
import {
  isMapOutputToggleablePlugin,
  isMapScopedPinOutput,
  isViewerScopedPinOutput,
} from "./pin-output";

function stubPlugin(
  overrides: Partial<PluginDefinition> & Pick<PluginDefinition, "id">,
): PluginDefinition {
  return {
    displayName: overrides.id,
    icon: () => null,
    implemented: true,
    ...overrides,
  };
}

describe("pin output scope", () => {
  it("defaults PinDetailSection plugins to map scope", () => {
    const plugin = stubPlugin({
      id: "wikidata",
      PinDetailSection: () => null,
    });
    expect(isMapScopedPinOutput(plugin)).toBe(true);
    expect(isViewerScopedPinOutput(plugin)).toBe(false);
  });

  it("honors viewer scope", () => {
    const plugin = stubPlugin({
      id: "lastfm",
      pinOutputScope: "viewer",
      PinDetailSection: () => null,
    });
    expect(isViewerScopedPinOutput(plugin)).toBe(true);
    expect(isMapScopedPinOutput(plugin)).toBe(false);
  });

  it("lists toggleable map interaction plugins", () => {
    const plugin = stubPlugin({
      id: "comments",
      PinInteractionSection: () => null,
    });
    expect(isMapOutputToggleablePlugin(plugin)).toBe(true);
  });

  it("lists toggleable map output plugins", () => {
    const plugin = stubPlugin({
      id: "spotify",
      PinDetailSection: () => null,
    });
    expect(isMapOutputToggleablePlugin(plugin)).toBe(true);
    expect(
      isMapOutputToggleablePlugin(
        stubPlugin({
          id: "lastfm",
          pinOutputScope: "viewer",
          PinDetailSection: () => null,
        }),
      ),
    ).toBe(false);
  });
});
