import { describe, expect, it } from "vitest";

import {
  isLikelyCrawlerUserAgent,
  mapBlocksPublicCrawlers,
} from "@/lib/public-map-crawler-block";

describe("public-map-crawler-block", () => {
  it("only blocks crawlers when the map is public and opted in", () => {
    expect(
      mapBlocksPublicCrawlers({ is_public: true, block_public_crawlers: true }),
    ).toBe(true);
    expect(
      mapBlocksPublicCrawlers({
        is_public: false,
        block_public_crawlers: true,
      }),
    ).toBe(false);
    expect(
      mapBlocksPublicCrawlers({
        is_public: true,
        block_public_crawlers: false,
      }),
    ).toBe(false);
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
