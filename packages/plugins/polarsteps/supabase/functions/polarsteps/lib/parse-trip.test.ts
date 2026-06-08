import { assertEquals } from "jsr:@std/assert@1";
import { parseTrip, resolveMediaUrl, stripHtml } from "./parse-trip.ts";

Deno.test("stripHtml removes tags and decodes entities", () => {
  assertEquals(stripHtml("<p>Hello&nbsp;<b>world</b></p>"), "Hello world");
});

Deno.test("resolveMediaUrl returns absolute URLs as-is", () => {
  assertEquals(
    resolveMediaUrl({
      id: 1,
      uuid: "x",
      cdn_path: "https://cdn.example.com/photo.jpg",
    }),
    "https://cdn.example.com/photo.jpg",
  );
});

Deno.test("resolveMediaUrl prefixes relative paths", () => {
  const url = resolveMediaUrl({
    id: 1,
    uuid: "x",
    path: "/media/photo.jpg",
  });
  if (!url?.startsWith("https://")) {
    throw new Error(`expected https URL, got ${url}`);
  }
  if (!url.includes("/media/photo.jpg")) {
    throw new Error(`expected path in URL, got ${url}`);
  }
});

Deno.test("parseTrip parses steps with coords and photos", () => {
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

  assertEquals(parsed.title, "Road trip");
  assertEquals(parsed.stepCount, 1);
  assertEquals(parsed.photoCount, 1);
  assertEquals(parsed.steps[0]?.dedupKey, "polarsteps:step:123:1");
  assertEquals(parsed.steps[0]?.description, "Nice city");
  assertEquals(parsed.steps[0]?.photos[0]?.mediaId, "99");
});

Deno.test("parseTrip skips steps without coordinates", () => {
  const parsed = parseTrip({
    id: 1,
    name: "Empty",
    all_steps: [{ id: 2, uuid: "x", location: null }],
  });
  assertEquals(parsed.stepCount, 0);
});
