import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FabButton } from "./fab";

describe("FabButton", () => {
  it("renders without crashing", () => {
    render(
      <FabButton aria-label="Add" onClick={() => {}}>
        +
      </FabButton>,
    );
    expect(document.body).toBeTruthy();
  });
});
