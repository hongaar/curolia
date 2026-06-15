import { describe, expect, it } from "vitest";
import { tagsFromNominatimRow } from "./poi-nominatim";

describe("tagsFromNominatimRow", () => {
  it("maps jsonv2 category+type to amenity tags", () => {
    expect(
      tagsFromNominatimRow({
        category: "amenity",
        type: "cafe",
        name: "Badabing",
      }),
    ).toEqual({ amenity: "cafe", name: "Badabing" });
  });

  it("still supports legacy class field", () => {
    expect(
      tagsFromNominatimRow({
        class: "shop",
        type: "clothes",
        name: "Marlies Dekkers",
      }),
    ).toEqual({ shop: "clothes", name: "Marlies Dekkers" });
  });
});
