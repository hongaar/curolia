import { describe, expect, it } from "vitest";

// Pure helper mirrored from the hook for unit tests without Capacitor/viewport.
function shouldUseStackTransitions(
  isNativePlatform: boolean,
  isMaxSmViewport: boolean,
): boolean {
  return isNativePlatform || isMaxSmViewport;
}

describe("useStackTransitions", () => {
  it("enables mobile chrome on native or narrow viewports", () => {
    expect(shouldUseStackTransitions(true, false)).toBe(true);
    expect(shouldUseStackTransitions(false, true)).toBe(true);
  });

  it("disables mobile chrome on desktop web viewports", () => {
    expect(shouldUseStackTransitions(false, false)).toBe(false);
  });
});
