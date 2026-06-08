import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("badge", () => {
  it("renders without crashing", () => {
    render(<Badge>Badge</Badge>);
    expect(document.body).toBeTruthy();
  });
});
