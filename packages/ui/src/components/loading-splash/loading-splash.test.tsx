import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CuroliaLoadingSplash } from "./loading-splash";

describe("CuroliaLoadingSplash", () => {
  it("renders without crashing", () => {
    render(<CuroliaLoadingSplash />);
    expect(document.body).toBeTruthy();
  });
});
