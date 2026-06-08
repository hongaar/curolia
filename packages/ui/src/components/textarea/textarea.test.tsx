import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Textarea } from "./textarea";

describe("textarea", () => {
  it("renders without crashing", () => {
    render(<Textarea placeholder="Test" />);
    expect(document.body).toBeTruthy();
  });
});
