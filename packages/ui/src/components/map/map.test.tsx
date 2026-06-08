import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MapPageRoot } from "./map";

describe("map", () => {
  it("renders without crashing", () => {
    render(
      <MapPageRoot>
        <div>Map</div>
      </MapPageRoot>,
    );
    expect(document.body).toBeTruthy();
  });
});
