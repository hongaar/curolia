import { describe, expect, it } from "vitest";

import { formatCommentDate } from "./format-comment-date";

const NOW = Date.parse("2026-06-15T12:00:00.000Z");

describe("formatCommentDate", () => {
  it("returns empty string for invalid input", () => {
    expect(formatCommentDate("not-a-date", NOW)).toBe("");
  });

  it("formats recent comments as just now", () => {
    expect(formatCommentDate("2026-06-15T11:59:30.000Z", NOW)).toBe("just now");
    expect(formatCommentDate("2026-06-15T11:59:01.000Z", NOW)).toBe("just now");
  });

  it("formats minutes, hours, days, weeks, months, and years", () => {
    expect(formatCommentDate("2026-06-15T11:58:00.000Z", NOW)).toBe("2m ago");
    expect(formatCommentDate("2026-06-15T11:00:00.000Z", NOW)).toBe("1h ago");
    expect(formatCommentDate("2026-06-13T12:00:00.000Z", NOW)).toBe("2d ago");
    expect(formatCommentDate("2026-06-01T12:00:00.000Z", NOW)).toBe("2w ago");
    expect(formatCommentDate("2026-03-15T12:00:00.000Z", NOW)).toBe("3mo ago");
    expect(formatCommentDate("2024-06-15T12:00:00.000Z", NOW)).toBe("2y ago");
  });

  it("never returns negative-relative labels for future timestamps", () => {
    expect(formatCommentDate("2026-06-15T12:05:00.000Z", NOW)).toBe("just now");
  });
});
