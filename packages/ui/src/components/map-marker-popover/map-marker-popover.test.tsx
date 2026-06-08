import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MapMarkerPopoverActions } from "./map-marker-popover";

describe("MapMarkerPopoverActions", () => {
  it("renders without crashing", () => {
    render(<MapMarkerPopoverActions />);
    expect(document.body).toBeTruthy();
  });
});
