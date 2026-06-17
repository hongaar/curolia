import { describe, expect, it } from "vitest";
import {
  parseDmsLatLng,
  parseLatLngPair,
  parseLocationCoordinates,
} from "./coords.ts";

describe("parseLatLngPair", () => {
  it("parses decimal pairs with comma or space separators", () => {
    expect(parseLatLngPair("52.078070984022084, 5.293483642249383")).toEqual({
      lat: 52.078070984022084,
      lng: 5.293483642249383,
    });
    expect(parseLatLngPair("48.8584 2.2945")).toEqual({
      lat: 48.8584,
      lng: 2.2945,
    });
  });

  it("parses decimal pairs with cardinal suffixes", () => {
    expect(parseLatLngPair("45.98 N, 8.51 E")).toEqual({
      lat: 45.98,
      lng: 8.51,
    });
  });
});

describe("parseDmsLatLng", () => {
  it("parses degrees-minutes-seconds with hemisphere labels", () => {
    const coords = parseDmsLatLng(`45°59'02.4"N 8°30'32.9"E`);
    expect(coords?.lat).toBeCloseTo(45.984, 3);
    expect(coords?.lng).toBeCloseTo(8.509, 3);
  });
});

describe("parseLocationCoordinates", () => {
  it("accepts decimal and DMS formats", () => {
    expect(parseLocationCoordinates("52.078, 5.293")).toEqual({
      lat: 52.078,
      lng: 5.293,
    });
    expect(parseLocationCoordinates(`45°59'02.4"N 8°30'32.9"E`)).not.toBeNull();
  });
});
