import {
  pinMetadataShowSelectItems,
  pinMetadataShowSelectSummary,
  type PinMetadataShowFieldKey,
} from "@curolia/plugin-contract";
import { describe, expect, it } from "vitest";

const ITEMS = {
  ...pinMetadataShowSelectItems(),
  place_name: "Name",
  place_type: "Type",
  cuisine: "Cuisine",
  dietary_options: "Dietary",
  wheelchair_access: "Accessibility",
  dog_policy: "Dogs",
  brand: "Brand",
  operator: "Operator",
  opening_hours: "Hours",
  phone: "Phone",
  website: "Website",
  email: "Email",
};

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
        ["place_name", "place_type", "cuisine", "phone"],
        ITEMS,
      ),
    ).toBe("Name, Type, Cuisine, 1 more field selected");

    expect(
      pinMetadataShowSelectSummary(
        [
          "place_name",
          "place_type",
          "cuisine",
          "dietary_options",
          "wheelchair_access",
          "phone",
        ],
        ITEMS,
      ),
    ).toBe("Name, Type, Cuisine, 3 more fields selected");
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
