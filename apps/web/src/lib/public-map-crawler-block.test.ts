import { describe, expect, it } from "vitest";

import {
  blocksPublicCrawlers,
  isLikelyCrawlerUserAgent,
} from "@/lib/public-map-crawler-block";

describe("public-map-crawler-block", () => {
  it("only blocks crawlers for unlisted content", () => {
    expect(blocksPublicCrawlers({ visibility: "unlisted" })).toBe(true);
    expect(blocksPublicCrawlers({ visibility: "public" })).toBe(false);
    expect(blocksPublicCrawlers({ visibility: "private" })).toBe(false);
  });

  it("detects common crawler user agents", () => {
    expect(isLikelyCrawlerUserAgent("Mozilla/5.0 Googlebot/2.1")).toBe(true);
    expect(isLikelyCrawlerUserAgent("GPTBot/1.0")).toBe(true);
    expect(
      isLikelyCrawlerUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      ),
    ).toBe(false);
  });
});
