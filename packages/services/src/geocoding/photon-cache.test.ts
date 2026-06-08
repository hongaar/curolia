import { afterEach, describe, expect, it, vi } from "vitest";
import { reverseGeocodeDetails, reverseGeocodeForStorage } from "./client.ts";

const sampleFeature = {
  geometry: { type: "Point", coordinates: [2.3522, 48.8566] },
  properties: {
    name: "Rue de Rivoli",
    street: "Rue de Rivoli",
    city: "Paris",
    country: "France",
  },
};

describe("photon reverse geocode cache", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("coalesces parallel storage + details calls into one Photon request", async () => {
    let reverseCalls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/reverse")) reverseCalls += 1;
        return {
          ok: true,
          json: async () => ({ features: [sampleFeature] }),
        };
      }),
    );

    const lat = 48.8566;
    const lng = 2.3522;
    const [details, geocode] = await Promise.all([
      reverseGeocodeDetails(lat, lng, 14),
      reverseGeocodeForStorage(lat, lng),
    ]);

    expect(reverseCalls).toBe(1);
    expect(details.shortTitle).toBe("Rue de Rivoli");
    expect(geocode?.source).toBe("photon");
    expect(geocode?.properties.city).toBe("Paris");
  });
});
