import {
  getStackChain,
  isBaseRoute,
  isStackRoute,
  orderStackPaths,
  shouldAnimateStackTransition,
} from "@/lib/stack-routes";
import { describe, expect, it } from "vitest";

describe("isStackRoute", () => {
  it("matches account, settings, and plugins routes", () => {
    expect(isStackRoute("/profile")).toBe(true);
    expect(isStackRoute("/settings")).toBe(true);
    expect(isStackRoute("/plugins")).toBe(true);
    expect(isStackRoute("/notifications")).toBe(true);
    expect(isStackRoute("/invitations")).toBe(true);
  });

  it("matches map settings and pin detail", () => {
    expect(isStackRoute("/joram/trip/settings")).toBe(true);
    expect(isStackRoute("/joram/trip/pin/my-pin")).toBe(true);
  });

  it("does not match primary map views", () => {
    expect(isStackRoute("/joram/summer-2024/map")).toBe(false);
    expect(isStackRoute("/joram/summer-2024/blog")).toBe(false);
    expect(isStackRoute("/settings/plugins")).toBe(false);
  });
});

describe("isBaseRoute", () => {
  it("matches profile-scoped map and blog routes", () => {
    expect(isBaseRoute("/joram/trip/map")).toBe(true);
    expect(isBaseRoute("/joram/trip/blog")).toBe(true);
  });

  it("does not match stack screens", () => {
    expect(isBaseRoute("/settings")).toBe(false);
    expect(isBaseRoute("/plugins")).toBe(false);
    expect(isBaseRoute("/joram/trip/pin/a")).toBe(false);
  });
});

describe("getStackChain", () => {
  it("returns a single segment per stack route", () => {
    expect(getStackChain("/profile")).toEqual(["/profile"]);
    expect(getStackChain("/plugins")).toEqual(["/plugins"]);
    expect(getStackChain("/joram/trip/pin/j")).toEqual(["/joram/trip/pin/j"]);
  });
});

describe("orderStackPaths", () => {
  it("returns each flat stack path", () => {
    expect(orderStackPaths(["/plugins"])).toEqual(["/plugins"]);
    expect(orderStackPaths(["/plugins", "/settings"]).sort()).toEqual(
      ["/plugins", "/settings"].sort(),
    );
  });
});

describe("shouldAnimateStackTransition", () => {
  it("animates between base and stack", () => {
    expect(
      shouldAnimateStackTransition("/joram/trip/map", "/settings", "PUSH"),
    ).toBe(true);
    expect(
      shouldAnimateStackTransition("/joram/trip/map", "/plugins", "PUSH"),
    ).toBe(true);
    expect(
      shouldAnimateStackTransition("/settings", "/joram/trip/map", "POP"),
    ).toBe(true);
  });

  it("skips base-to-base and REPLACE", () => {
    expect(
      shouldAnimateStackTransition("/joram/a/map", "/joram/b/map", "PUSH"),
    ).toBe(false);
    expect(
      shouldAnimateStackTransition("/settings", "/plugins", "REPLACE"),
    ).toBe(false);
  });
});
