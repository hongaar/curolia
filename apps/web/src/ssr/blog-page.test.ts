import { describe, expect, it } from "vitest";

import { renderBlogPageHtml } from "@/ssr/blog-page";

describe("renderBlogPageHtml", () => {
  it("renders blog layout and markdown with UI class names", () => {
    const html = renderBlogPageHtml({
      mapName: "Europe trip",
      mapRoute: { profileSlug: "joram", mapSlug: "europe" },
      owner: {
        displayName: "Joram",
        avatarUrl: null,
        bio: "Traveler",
      },
      pins: [
        {
          id: "1",
          slug: "paris",
          title: "Paris",
          description: "A **great** city.",
          date: "2024-06-01",
          end_date: null,
        },
      ],
    });

    expect(html).toContain("Europe trip");
    expect(html).toContain("joram/europe/pin/paris");
    expect(html).toMatch(/pinList/);
    expect(html).toMatch(/pinTitle/);
    expect(html).toContain("<strong>great</strong>");
  });
});
