import { describe, expect, it } from "vitest";

import { renderPinPageHtml } from "@/ssr/pin-page";

describe("renderPinPageHtml", () => {
  it("renders pin detail layout with UI class names", () => {
    const html = renderPinPageHtml({
      mapName: "Europe trip",
      pin: {
        title: "Paris",
        description: "City of **lights**.",
        date: "2024-06-01",
        end_date: null,
        geocode: null,
        location_label_detail: "Paris, France",
      },
    });

    expect(html).toContain("Paris");
    expect(html).toContain("Europe trip");
    expect(html).toMatch(/detailTitle/);
    expect(html).toContain("<strong>lights</strong>");
  });
});
