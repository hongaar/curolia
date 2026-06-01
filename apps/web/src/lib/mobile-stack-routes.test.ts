import {
  isMobileStackRoute,
  shouldAnimateMobileStackTransition,
} from "@/lib/mobile-stack-routes";
import { describe, expect, it } from "vitest";

describe("isMobileStackRoute", () => {
  it("matches account and settings routes", () => {
    expect(isMobileStackRoute("/profile")).toBe(true);
    expect(isMobileStackRoute("/settings")).toBe(true);
    expect(isMobileStackRoute("/settings/plugins")).toBe(true);
    expect(isMobileStackRoute("/notifications")).toBe(true);
    expect(isMobileStackRoute("/invitations")).toBe(true);
  });

  it("matches journal settings and trace detail", () => {
    expect(isMobileStackRoute("/journals/abc/settings")).toBe(true);
    expect(isMobileStackRoute("/traces/my-journal/my-trace")).toBe(true);
  });

  it("does not match primary journal views", () => {
    expect(isMobileStackRoute("/map/summer-2024")).toBe(false);
    expect(isMobileStackRoute("/blog/summer-2024")).toBe(false);
    expect(isMobileStackRoute("/blog")).toBe(false);
  });
});

describe("shouldAnimateMobileStackTransition", () => {
  it("animates between root and stack", () => {
    expect(
      shouldAnimateMobileStackTransition("/map/trip", "/settings", "PUSH"),
    ).toBe(true);
    expect(
      shouldAnimateMobileStackTransition("/settings", "/map/trip", "POP"),
    ).toBe(true);
  });

  it("skips root-to-root and REPLACE", () => {
    expect(shouldAnimateMobileStackTransition("/map/a", "/map/b", "PUSH")).toBe(
      false,
    );
    expect(
      shouldAnimateMobileStackTransition(
        "/settings",
        "/settings/plugins",
        "REPLACE",
      ),
    ).toBe(false);
  });
});
