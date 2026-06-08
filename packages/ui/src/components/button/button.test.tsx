import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("button", () => {
  it("renders without crashing", () => {
    render(<Button>Click</Button>);
    expect(document.body).toBeTruthy();
  });
});
