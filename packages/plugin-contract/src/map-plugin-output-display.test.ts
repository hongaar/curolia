import { describe, expect, it } from "vitest";
import {
  isPluginOutputShownOnMap,
  mapPluginOutputShowDirty,
  mapPluginOutputShowForStorage,
  resolveMapPluginOutputShow,
} from "./map-plugin-output-display";

describe("map plugin output display", () => {
  it("defaults to shown when unset", () => {
    expect(isPluginOutputShownOnMap({}, "wikidata")).toBe(true);
  });

  it("respects explicit false", () => {
    expect(isPluginOutputShownOnMap({ wikidata: false }, "wikidata")).toBe(
      false,
    );
  });

  it("stores only hidden plugins", () => {
    expect(
      mapPluginOutputShowForStorage({ wikidata: false, spotify: true }),
    ).toEqual({ wikidata: false });
  });

  it("detects dirty settings", () => {
    expect(
      mapPluginOutputShowDirty({ wikidata: false }, { wikidata: false }),
    ).toBe(false);
    expect(mapPluginOutputShowDirty({}, { wikidata: false })).toBe(true);
  });

  it("parses stored json", () => {
    expect(resolveMapPluginOutputShow({ wikidata: false })).toEqual({
      wikidata: false,
    });
    expect(resolveMapPluginOutputShow(null)).toEqual({});
  });
});
