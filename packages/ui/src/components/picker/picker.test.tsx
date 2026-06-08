import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PresetColorPicker } from "./picker";

describe("PresetColorPicker", () => {
  it("renders without crashing", () => {
    render(<PresetColorPicker value="#ff0000" onChange={() => {}} />);
    expect(document.body).toBeTruthy();
  });
});
