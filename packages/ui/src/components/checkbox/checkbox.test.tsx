import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Label } from "../label";
import { Checkbox } from "./checkbox";

describe("checkbox", () => {
  it("renders without crashing", () => {
    render(<Checkbox />);
    expect(document.body).toBeTruthy();
  });

  it("anchors the hidden native input to the control instead of the viewport", () => {
    render(
      <Label>
        <Checkbox />
        Option
      </Label>,
    );
    const anchor = document.querySelector('[data-slot="checkbox-anchor"]');
    const input = anchor?.querySelector('input[type="checkbox"]');
    expect(anchor).toBeTruthy();
    expect(input).toBeTruthy();
    expect(input?.parentElement).toBe(anchor);
    expect(getComputedStyle(input!).position).toBe("absolute");
  });
});
