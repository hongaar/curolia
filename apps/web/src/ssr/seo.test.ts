import { describe, expect, it } from "vitest";

import {
  DEFAULT_DESCRIPTION,
  marketingSitemapPaths,
  matchSpaPageMeta,
  renderSitemapXml,
} from "@/ssr/seo";

describe("seo", () => {
  it("lists static marketing and campaign paths for the sitemap", () => {
    const paths = marketingSitemapPaths();
    expect(paths).toContain("/");
    expect(paths).toContain("/contact");
    expect(paths).toContain("/for/travel");
  });

  it("renders a valid sitemap with canonical URLs", () => {
    const xml = renderSitemapXml("https://curolia.com", "2026-06-10");
    expect(xml).toContain("<loc>https://curolia.com/</loc>");
    expect(xml).toContain("<loc>https://curolia.com/for/travel</loc>");
    expect(xml).toContain("<lastmod>2026-06-10</lastmod>");
  });

  it("marks auth and app routes as noindex", () => {
    expect(matchSpaPageMeta("/login")?.robots).toBe("noindex, nofollow");
    expect(matchSpaPageMeta("/maps")?.robots).toBe("noindex, nofollow");
    expect(matchSpaPageMeta("/joram/europe")?.robots).toBe("noindex, nofollow");
  });

  it("does not add SPA meta for SSR marketing paths", () => {
    expect(matchSpaPageMeta("/")).toBeNull();
    expect(matchSpaPageMeta("/privacy")).toBeNull();
    expect(matchSpaPageMeta("/for/food")).toBeNull();
  });

  it("keeps the default description within common snippet length", () => {
    expect(DEFAULT_DESCRIPTION.length).toBeLessThanOrEqual(160);
  });
});
