import { shouldUseMobileStackLayout } from "@/hooks/use-mobile-stack-layout";
import { describe, expect, it } from "vitest";

describe("shouldUseMobileStackLayout", () => {
  it("is enabled on native or narrow viewports", () => {
    expect(shouldUseMobileStackLayout(true, false)).toBe(true);
    expect(shouldUseMobileStackLayout(false, true)).toBe(true);
    expect(shouldUseMobileStackLayout(true, true)).toBe(true);
  });

  it("is disabled on desktop web viewports", () => {
    expect(shouldUseMobileStackLayout(false, false)).toBe(false);
  });
});
