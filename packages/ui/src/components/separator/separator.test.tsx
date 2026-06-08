import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Separator } from "./separator";

describe("separator", () => {
  it("renders without crashing", () => {
    render(<Separator />);
    expect(document.body).toBeTruthy();
  });
});
