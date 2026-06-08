import { describe, expect, it } from "vitest";
import { suggestEmojiForNameSync, suggestEmojiHeuristic } from "./heuristic.ts";
import { DEFAULT_LIST_EMOJI } from "./types.ts";

describe("suggestEmojiForNameSync", () => {
  it("matches starred places", () => {
    expect(suggestEmojiForNameSync("Starred places").emoji).toBe("⭐");
  });

  it("matches coffee-related names", () => {
    const result = suggestEmojiForNameSync("Coffee shops");
    expect(["☕", "🍽️"]).toContain(result.emoji);
    expect(result.source).toBe("heuristic");
  });

  it("matches restaurants", () => {
    expect(suggestEmojiForNameSync("Restaurants").emoji).toBe("🍽️");
  });

  it("returns fallback for unknown names", () => {
    const result = suggestEmojiForNameSync("Random xyz qwerty", {
      fallback: "📋",
    });
    expect(result.emoji).toBe("📋");
    expect(result.source).toBe("default");
  });

  it("uses default list emoji when no fallback specified", () => {
    expect(suggestEmojiForNameSync("Xyz unknown").emoji).toBe(
      DEFAULT_LIST_EMOJI,
    );
  });
});

describe("suggestEmojiHeuristic", () => {
  it("matches want to go", () => {
    expect(suggestEmojiHeuristic("Want to go").emoji).toBe("📌");
  });

  it("matches hiking trails", () => {
    expect(suggestEmojiHeuristic("Hiking trails").confidence).not.toBe("low");
  });
});
