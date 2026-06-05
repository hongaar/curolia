import { describe, expect, it } from "vitest";
import { linkDisplayTitle, linkTitleFromUrl } from "./pin-links";

describe("linkTitleFromUrl", () => {
  it("reads Google Maps place path", () => {
    expect(
      linkTitleFromUrl(
        "https://www.google.com/maps/place/Eiffel+Tower/@48.8584,2.2945,17z",
      ),
    ).toBe("Eiffel Tower");
  });
});

describe("linkDisplayTitle", () => {
  it("prefers URL place name over generic stored title", () => {
    expect(
      linkDisplayTitle({
        title: "Google Maps",
        url: "https://www.google.com/maps/place/Louvre+Museum/@48.8606,2.3376,17z",
      }),
    ).toBe("Louvre Museum");
  });

  it("keeps a specific stored title", () => {
    expect(
      linkDisplayTitle({
        title: "My favorite café",
        url: "https://example.com",
      }),
    ).toBe("My favorite café");
  });
});
