import {
  isMapScopedPinOutput,
  isViewerScopedPinOutput,
} from "@curolia/plugin-contract";
import { describe, expect, it } from "vitest";
import { mapScopedDetailPlugins } from "./use-pin-output-plugins";

describe("usePinOutputPlugins helpers", () => {
  it("lists map-scoped detail plugins from registry", () => {
    const ids = mapScopedDetailPlugins().map((p) => p.id);
    expect(ids).toContain("wikidata");
    expect(ids).toContain("spotify");
    expect(ids).not.toContain("lastfm");
  });

  it("classifies lastfm as viewer-scoped when present", () => {
    const lastfm = mapScopedDetailPlugins().find((p) => p.id === "lastfm");
    expect(lastfm).toBeUndefined();
  });

  it("viewer scope detection", () => {
    expect(
      isViewerScopedPinOutput({
        pinOutputScope: "viewer",
        PinDetailSection: () => null,
      }),
    ).toBe(true);
    expect(
      isMapScopedPinOutput({
        PinDetailSection: () => null,
      }),
    ).toBe(true);
  });
});
