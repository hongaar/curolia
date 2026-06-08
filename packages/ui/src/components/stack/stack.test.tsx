import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Stack } from "./stack";

describe("stack", () => {
  it("renders without crashing", () => {
    render(<Stack>Content</Stack>);
    expect(document.body).toBeTruthy();
  });
});
