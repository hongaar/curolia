import {
  pinMetadataShowSelectItems,
  pinMetadataShowSelectSummary,
  type PinMetadataShowFieldKey,
} from "@curolia/plugin-contract";
import { describe, expect, it } from "vitest";

const ITEMS = pinMetadataShowSelectItems();

describe("pinMetadataShowSelectSummary", () => {
  it("summarizes a single field by label", () => {
    expect(pinMetadataShowSelectSummary(["phone"], ITEMS)).toBe("Phone");
  });

  it("joins two or three fields as csv", () => {
    expect(
      pinMetadataShowSelectSummary(["place_type", "cuisine", "phone"], ITEMS),
    ).toBe("Type, Cuisine, Phone");
  });

  it("shows the first three labels plus a more count for four or more", () => {
    expect(
      pinMetadataShowSelectSummary(
        ["place_type", "cuisine", "dietary_options", "phone"],
        ITEMS,
      ),
    ).toBe("Type, Cuisine, Dietary, 1 more field selected");

    expect(
      pinMetadataShowSelectSummary(
        [
          "place_type",
          "cuisine",
          "dietary_options",
          "wheelchair_access",
          "dog_policy",
          "phone",
        ],
        ITEMS,
      ),
    ).toBe("Type, Cuisine, Dietary, 3 more fields selected");
  });

  it("returns All fields when every toggleable field is selected", () => {
    expect(
      pinMetadataShowSelectSummary(
        Object.keys(ITEMS) as PinMetadataShowFieldKey[],
        ITEMS,
      ),
    ).toBe("All fields");
  });
});
