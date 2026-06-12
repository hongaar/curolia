import { describe, expect, it } from "vitest";

import { buildCalendar } from "./build-calendar.ts";

const basePin = {
  id: "11111111-1111-1111-1111-111111111111",
  slug: "eiffel-tower",
  title: "Eiffel Tower",
  description: "Iconic landmark visit.",
  geocode: {
    source: "photon",
    lat: 48.8584,
    lng: 2.2945,
    fetchedAt: "2026-01-01T00:00:00.000Z",
    properties: {
      city: "Paris",
      country: "France",
    },
  },
  location_label_detail: "city_country",
  lat: 48.8584,
  lng: 2.2945,
  date: "2026-06-12",
  end_date: null,
};

describe("buildCalendar", () => {
  it("includes description, location, and pin URL", () => {
    const body = buildCalendar({
      mapName: "Europe trip",
      mapId: "22222222-2222-2222-2222-222222222222",
      profileSlug: "joram",
      mapSlug: "europe-2026",
      siteOrigin: "https://curolia.com",
      pins: [basePin],
    });

    expect(body).toContain("DESCRIPTION:Iconic landmark visit.");
    expect(body).toContain("LOCATION:Paris\\, France");
    expect(body).toContain(
      "URL:https://curolia.com/joram/europe-2026/pin/eiffel-tower",
    );
    expect(body).toContain("GEO:48.8584;2.2945");
  });

  it("omits location when geocode is missing", () => {
    const body = buildCalendar({
      mapName: "Trip",
      mapId: "22222222-2222-2222-2222-222222222222",
      profileSlug: "joram",
      mapSlug: "trip",
      siteOrigin: "https://curolia.com",
      pins: [{ ...basePin, geocode: null }],
    });

    expect(body).not.toContain("LOCATION:");
    expect(body).toContain(
      "URL:https://curolia.com/joram/trip/pin/eiffel-tower",
    );
  });
});
