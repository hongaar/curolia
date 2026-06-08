import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Switch } from "./switch";

describe("switch", () => {
  it("renders without crashing", () => {
    render(<Switch />);
    expect(document.body).toBeTruthy();
  });
});
