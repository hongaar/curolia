import { describe, expect, it } from "vitest";

import { canNavigateBack, shouldShowPageBackButton } from "./can-navigate-back";

describe("canNavigateBack", () => {
  it("uses React Router idx when present", () => {
    expect(canNavigateBack({ idx: 0 })).toBe(false);
    expect(canNavigateBack({ idx: 1 })).toBe(true);
  });

  it("treats bottom-sheet history state as navigable when length > 1", () => {
    const length = window.history.length;
    Object.defineProperty(window.history, "length", {
      configurable: true,
      value: Math.max(length, 2),
    });
    expect(canNavigateBack({ bottomSheet: true } as { idx?: number })).toBe(
      true,
    );
    Object.defineProperty(window.history, "length", {
      configurable: true,
      value: length,
    });
  });
});

describe("shouldShowPageBackButton", () => {
  it("always shows on stack routes even at history idx 0", () => {
    expect(shouldShowPageBackButton("/settings", { idx: 0 })).toBe(true);
    expect(shouldShowPageBackButton("/joram/trip/settings", { idx: 0 })).toBe(
      true,
    );
  });

  it("follows history on non-stack routes", () => {
    expect(shouldShowPageBackButton("/joram/trip/map", { idx: 0 })).toBe(false);
    expect(shouldShowPageBackButton("/joram/trip/map", { idx: 1 })).toBe(true);
  });
});
