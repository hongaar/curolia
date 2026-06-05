import { pinMetadataFromOsmTags } from "@curolia/plugin-osm-poi";
import { describe, expect, it } from "vitest";

describe("pinMetadataFromOsmTags", () => {
  it("maps common OSM tags into normalized metadata fields", () => {
    const fields = pinMetadataFromOsmTags({
      name: "Corner Café",
      amenity: "cafe",
      cuisine: "italian",
      wheelchair: "yes",
      dog: "yes",
      phone: "+31 20 123 4567",
      website: "example.com",
      opening_hours: "Mo-Fr 09:00-18:00; Sa 10:00-14:00",
      email: "hello@example.com",
      brand: "Local Roasters",
      takeaway: "yes",
    });

    expect(fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldKey: "place_name",
          value: { label: "Corner Café" },
        }),
        expect.objectContaining({
          fieldKey: "place_type",
          value: { label: "Café" },
        }),
        expect.objectContaining({
          fieldKey: "wheelchair_access",
          value: { level: "yes" },
        }),
        expect.objectContaining({
          fieldKey: "place_facts",
          value: expect.objectContaining({
            facts: expect.arrayContaining([
              { label: "Takeaway", value: "Yes" },
            ]),
          }),
        }),
        expect.objectContaining({
          fieldKey: "place_categories",
          value: { food: true, outdoor: false },
        }),
      ]),
    );
  });

  it("returns only categories when tags have no displayable metadata", () => {
    const fields = pinMetadataFromOsmTags({ amenity: "bench" });
    expect(fields).toEqual([
      expect.objectContaining({
        fieldKey: "place_type",
        value: { label: "Bench" },
      }),
      expect.objectContaining({
        fieldKey: "place_categories",
        value: { food: false, outdoor: false },
      }),
    ]);
  });
});
