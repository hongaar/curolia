import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MapMarker } from "./map-marker";

describe("MapMarker", () => {
  it("renders without crashing", () => {
    render(<MapMarker />);
    expect(document.body).toBeTruthy();
  });
});
