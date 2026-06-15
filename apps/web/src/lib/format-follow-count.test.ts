import { describe, expect, it } from "vitest";

import { formatFollowCountLabel } from "@/lib/format-follow-count";

describe("formatFollowCountLabel", () => {
  it("uses singular nouns for one", () => {
    expect(formatFollowCountLabel(1, "follower")).toBe("1 follower");
    expect(formatFollowCountLabel(1, "following")).toBe("1 following");
  });

  it("uses plural nouns otherwise", () => {
    expect(formatFollowCountLabel(0, "follower")).toBe("0 followers");
    expect(formatFollowCountLabel(42, "following")).toBe("42 following");
  });
});
