import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MainToolbar } from "./main-toolbar";

describe("MainToolbar", () => {
  it("renders without crashing", () => {
    render(<MainToolbar left={<span>Left</span>} right={<span>Right</span>} />);
    expect(document.body).toBeTruthy();
  });
});
