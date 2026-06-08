import { describe, expect, it } from "vitest";
import { parseTrip, resolveMediaUrl, stripHtml } from "./parse-trip.ts";

describe("stripHtml", () => {
  it("removes tags and decodes entities", () => {
    expect(stripHtml("<p>Hello&nbsp;<b>world</b></p>")).toBe("Hello world");
  });
});

describe("resolveMediaUrl", () => {
  it("returns absolute URLs as-is", () => {
    expect(
      resolveMediaUrl({
        id: 1,
        uuid: "x",
        cdn_path: "https://cdn.example.com/photo.jpg",
      }),
    ).toBe("https://cdn.example.com/photo.jpg");
  });

  it("prefixes relative paths", () => {
    const url = resolveMediaUrl({
      id: 1,
      uuid: "x",
      path: "/media/photo.jpg",
    });
    expect(url).toMatch(/^https:\/\//);
    expect(url).toContain("/media/photo.jpg");
  });
});

describe("parseTrip", () => {
  it("parses steps with coords and photos", () => {
    const parsed = parseTrip(
      {
        id: 123,
        name: "Road trip",
        all_steps: [
          {
            id: 1,
            uuid: "step-uuid",
            location: { lat: 52.1, lon: 5.1, locality: "Utrecht" },
            start_time: 1_700_000_000,
            display_name: "Utrecht",
            description: "<p>Nice city</p>",
            media: [
              {
                id: 99,
                uuid: "photo-uuid",
                type: 1,
                path: "https://cdn.example.com/p.jpg",
                full_res_width: 1200,
                full_res_height: 800,
              },
            ],
          },
        ],
      },
      "https://www.polarsteps.com/User/123-road-trip?s=sec",
    );

    expect(parsed.title).toBe("Road trip");
    expect(parsed.stepCount).toBe(1);
    expect(parsed.photoCount).toBe(1);
    expect(parsed.steps[0]?.dedupKey).toBe("polarsteps:step:123:1");
    expect(parsed.steps[0]?.description).toBe("Nice city");
    expect(parsed.steps[0]?.photos[0]?.mediaId).toBe("99");
  });

  it("skips steps without coordinates", () => {
    const parsed = parseTrip({
      id: 1,
      name: "Empty",
      all_steps: [{ id: 2, uuid: "x", location: null }],
    });
    expect(parsed.stepCount).toBe(0);
  });
});
