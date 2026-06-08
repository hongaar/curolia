import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Checkbox } from "./checkbox";

describe("checkbox", () => {
  it("renders without crashing", () => {
    render(<Checkbox />);
    expect(document.body).toBeTruthy();
  });
});
