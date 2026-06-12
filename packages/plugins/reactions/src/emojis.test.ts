import { describe, expect, it } from "vitest";
import { QUICK_REACTION_EMOJIS, normalizeReactionEmoji } from "./emojis";

describe("normalizeReactionEmoji", () => {
  it("preserves heart emoji presentation (VS-16)", () => {
    expect(normalizeReactionEmoji("❤️")).toBe("❤️");
    expect(normalizeReactionEmoji("❤️")).not.toBe("❤");
  });

  it("upgrades text-default heart to emoji presentation", () => {
    expect(normalizeReactionEmoji("❤")).toBe("❤️");
  });

  it("keeps quick-pick emojis unchanged", () => {
    for (const emoji of QUICK_REACTION_EMOJIS) {
      expect(normalizeReactionEmoji(emoji)).toBe(emoji);
    }
  });

  it("takes the first grapheme from longer input", () => {
    expect(normalizeReactionEmoji("🎉 extra")).toBe("🎉");
  });
});
