import { describe, expect, it } from "vitest";

import { shouldAdoptUrlPinForBottomSheet } from "./use-map-pin-panel";

describe("shouldAdoptUrlPinForBottomSheet", () => {
  it("adopts URL pin on refresh when sheet pin is still null", () => {
    expect(shouldAdoptUrlPinForBottomSheet("pin-a", null, null)).toBe(true);
  });

  it("skips when sheet already matches URL", () => {
    expect(shouldAdoptUrlPinForBottomSheet("pin-a", "pin-a", null)).toBe(false);
  });

  it("skips while tap-led sheet waits for ?pin= to catch up", () => {
    expect(
      shouldAdoptUrlPinForBottomSheet("pin-old", "pin-new", "pin-new"),
    ).toBe(false);
  });

  it("adopts external URL navigation while sheet shows another pin", () => {
    expect(shouldAdoptUrlPinForBottomSheet("pin-b", "pin-a", null)).toBe(true);
  });
});
