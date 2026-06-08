import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "./input";

describe("input", () => {
  it("renders without crashing", () => {
    render(<Input placeholder="Test" />);
    expect(document.body).toBeTruthy();
  });
});
