import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ColorPicker } from "./color-picker";

describe("color-picker", () => {
  it("renders without crashing", () => {
    render(<ColorPicker value="#ff0000" onChange={() => {}} />);
    expect(document.body).toBeTruthy();
  });
});
