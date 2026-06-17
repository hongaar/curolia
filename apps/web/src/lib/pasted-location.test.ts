import { describe, expect, it } from "vitest";
import { looksLikePastedLocation } from "./pasted-location";

describe("looksLikePastedLocation", () => {
  it("detects decimal coordinates", () => {
    expect(
      looksLikePastedLocation("52.078070984022084, 5.293483642249383"),
    ).toBe(true);
  });

  it("detects DMS coordinates", () => {
    expect(looksLikePastedLocation(`45°59'02.4"N 8°30'32.9"E`)).toBe(true);
  });

  it("detects plus codes with locality", () => {
    expect(looksLikePastedLocation("37M6+MH Zeist")).toBe(true);
  });

  it("rejects unrelated prose", () => {
    expect(looksLikePastedLocation("meet me at the cafe")).toBe(false);
  });
});
