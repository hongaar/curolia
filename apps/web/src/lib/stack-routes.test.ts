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
    expect(isStackRoute("/maps/abc/settings")).toBe(true);
    expect(isStackRoute("/pins/my-map/my-pin")).toBe(true);
  });

  it("does not match primary map views or legacy plugin paths", () => {
    expect(isStackRoute("/map/summer-2024")).toBe(false);
    expect(isStackRoute("/blog/summer-2024")).toBe(false);
    expect(isStackRoute("/blog")).toBe(false);
    expect(isStackRoute("/settings/plugins")).toBe(false);
  });
});

describe("isBaseRoute", () => {
  it("matches map and blog map routes", () => {
    expect(isBaseRoute("/map/trip")).toBe(true);
    expect(isBaseRoute("/blog/trip")).toBe(true);
    expect(isBaseRoute("/blog")).toBe(true);
  });

  it("does not match stack screens", () => {
    expect(isBaseRoute("/settings")).toBe(false);
    expect(isBaseRoute("/plugins")).toBe(false);
    expect(isBaseRoute("/pins/a/b")).toBe(false);
  });
});

describe("getStackChain", () => {
  it("returns a single segment per stack route", () => {
    expect(getStackChain("/profile")).toEqual(["/profile"]);
    expect(getStackChain("/plugins")).toEqual(["/plugins"]);
    expect(getStackChain("/pins/j/t")).toEqual(["/pins/j/t"]);
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
    expect(shouldAnimateStackTransition("/map/trip", "/settings", "PUSH")).toBe(
      true,
    );
    expect(shouldAnimateStackTransition("/map/trip", "/plugins", "PUSH")).toBe(
      true,
    );
    expect(shouldAnimateStackTransition("/settings", "/map/trip", "POP")).toBe(
      true,
    );
  });

  it("skips base-to-base and REPLACE", () => {
    expect(shouldAnimateStackTransition("/map/a", "/map/b", "PUSH")).toBe(
      false,
    );
    expect(
      shouldAnimateStackTransition("/settings", "/plugins", "REPLACE"),
    ).toBe(false);
  });
});
