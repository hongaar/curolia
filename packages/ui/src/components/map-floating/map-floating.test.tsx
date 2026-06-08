import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MapFloatingAnchor } from "./map-floating";

describe("MapFloatingAnchor", () => {
  it("renders without crashing", () => {
    render(<MapFloatingAnchor />);
    expect(document.body).toBeTruthy();
  });
});
