import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PinDetailCard, PinDetailTitle } from "./pin-detail";

describe("PinDetailCard", () => {
  it("renders without crashing", () => {
    render(
      <PinDetailCard>
        <PinDetailTitle>Pin</PinDetailTitle>
      </PinDetailCard>,
    );
    expect(document.body).toBeTruthy();
  });
});
