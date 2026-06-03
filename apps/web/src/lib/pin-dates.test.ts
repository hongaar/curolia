import { describe, expect, it } from "vitest";
import { formatPinDateRange } from "./pin-dates";

const enGb = "en-GB";

describe("formatPinDateRange", () => {
  it("formats a single day without weekday", () => {
    expect(formatPinDateRange("2023-07-02", null, enGb)).toBe("2 July 2023");
    expect(formatPinDateRange("2023-07-02", "2023-07-02", enGb)).toBe(
      "2 July 2023",
    );
  });

  it("collapses same-month ranges", () => {
    expect(formatPinDateRange("2023-07-02", "2023-07-05", enGb)).toBe(
      "2 – 5 July 2023",
    );
  });

  it("keeps both months when the range crosses months in the same year", () => {
    expect(formatPinDateRange("2023-06-28", "2023-07-02", enGb)).toBe(
      "28 June – 2 July 2023",
    );
  });

  it("includes both years when the range crosses years", () => {
    expect(formatPinDateRange("2023-12-28", "2024-01-02", enGb)).toBe(
      "28 December 2023 – 2 January 2024",
    );
  });

  it("omits weekday names in range output", () => {
    const range = formatPinDateRange("2023-07-02", "2023-07-05", enGb);
    expect(range).not.toMatch(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/);
  });
});
