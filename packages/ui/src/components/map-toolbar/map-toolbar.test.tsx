import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MapToolbar } from "./map-toolbar";

describe("MapToolbar", () => {
  it("renders without crashing", () => {
    render(<MapToolbar />);
    expect(document.body).toBeTruthy();
  });
});
