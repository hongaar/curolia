import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FloatingPanel } from "./floating-panel";

describe("floating-panel", () => {
  it("renders without crashing", () => {
    render(
      <FloatingPanel>
        <div>Panel</div>
      </FloatingPanel>,
    );
    expect(document.body).toBeTruthy();
  });
});
