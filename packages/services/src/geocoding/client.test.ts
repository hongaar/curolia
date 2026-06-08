import { describe, expect, it } from "vitest";
import { defaultPlaceTitleForZoom } from "./client.ts";

describe("defaultPlaceTitleForZoom", () => {
  const props = {
    name: "Rue de Rivoli",
    street: "Rue de Rivoli",
    city: "Paris",
    state: "Île-de-France",
    country: "France",
  };

  it("uses country when zoomed far out", () => {
    expect(
      defaultPlaceTitleForZoom(props, "Rue de Rivoli, Paris, France", 4),
    ).toBe("France");
  });

  it("uses city once past country zoom band", () => {
    expect(
      defaultPlaceTitleForZoom(props, "Rue de Rivoli, Paris, France", 7),
    ).toBe("Paris");
  });

  it("uses city at metro zoom", () => {
    expect(
      defaultPlaceTitleForZoom(props, "Rue de Rivoli, Paris, France", 10),
    ).toBe("Paris");
  });

  it("uses street or POI name when zoomed in", () => {
    expect(
      defaultPlaceTitleForZoom(props, "Rue de Rivoli, Paris, France", 13),
    ).toBe("Rue de Rivoli");
  });
});
