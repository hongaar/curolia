import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Box } from "./box";

describe("box", () => {
  it("renders without crashing", () => {
    render(<Box>Content</Box>);
    expect(document.body).toBeTruthy();
  });
});
