import { describe, expect, it } from "vitest";

import { formatPinCount, formatTimeAgo } from "@/lib/format-time-ago";

describe("formatTimeAgo", () => {
  const now = Date.parse("2026-06-15T12:00:00.000Z");

  it("formats recent timestamps", () => {
    expect(formatTimeAgo("2026-06-15T11:59:30.000Z", now)).toBe("just now");
    expect(formatTimeAgo("2026-06-15T11:00:00.000Z", now)).toBe("1h ago");
    expect(formatTimeAgo("2026-06-12T12:00:00.000Z", now)).toBe("3d ago");
  });
});

describe("formatPinCount", () => {
  it("pluralizes pin counts", () => {
    expect(formatPinCount(0)).toBe("No pins");
    expect(formatPinCount(1)).toBe("1 pin");
    expect(formatPinCount(12)).toBe("12 pins");
  });
});
