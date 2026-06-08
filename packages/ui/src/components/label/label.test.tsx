import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Label } from "./label";

describe("label", () => {
  it("renders without crashing", () => {
    render(<Label htmlFor="x">Label</Label>);
    expect(document.body).toBeTruthy();
  });
});
