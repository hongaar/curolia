import { describe, expect, it } from "vitest";
import { decodePlusCode, parsePlusCodeText } from "./plus-code.ts";

describe("parsePlusCodeText", () => {
  it("extracts a short code with locality suffix", () => {
    expect(parsePlusCodeText("37M6+MH Zeist")).toEqual({
      code: "37M6+MH",
      locality: "Zeist",
    });
  });

  it("extracts a full code without locality", () => {
    expect(parsePlusCodeText("9F3W2G7Q+22")).toEqual({
      code: "9F3W2G7Q+22",
      locality: null,
    });
  });
});

describe("decodePlusCode", () => {
  it("decodes a full plus code", () => {
    const coords = decodePlusCode("849VCWC8+Q4");
    expect(coords?.lat).toBeCloseTo(37.422, 2);
    expect(coords?.lng).toBeCloseTo(-122.085, 2);
  });

  it("recovers a short code with a nearby reference", () => {
    const coords = decodePlusCode("37M6+MH", { lat: 52.09, lng: 5.23 });
    expect(coords?.lat).toBeCloseTo(52.09, 1);
    expect(coords?.lng).toBeCloseTo(5.23, 1);
  });
});
