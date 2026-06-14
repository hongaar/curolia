import { describe, expect, it } from "vitest";
import type { PluginDefinition } from "./definition";
import {
  hasMapScopedReadableOutput,
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

  it("detects map-scoped interaction plugins", () => {
    const plugin = stubPlugin({
      id: "comments",
      PinInteractionSection: () => null,
    });
    expect(hasMapScopedReadableOutput(plugin)).toBe(true);
  });

  it("detects map-scoped detail plugins", () => {
    const plugin = stubPlugin({
      id: "spotify",
      PinDetailSection: () => null,
    });
    expect(hasMapScopedReadableOutput(plugin)).toBe(true);
    expect(
      hasMapScopedReadableOutput(
        stubPlugin({
          id: "lastfm",
          pinOutputScope: "viewer",
          PinDetailSection: () => null,
        }),
      ),
    ).toBe(false);
  });
});
