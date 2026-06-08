import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChoiceCard, ChoiceCards } from "./choice-cards";

describe("ChoiceCards", () => {
  it("renders without crashing", () => {
    render(
      <ChoiceCards name="test" value="a" onValueChange={() => {}}>
        <ChoiceCard value="a" label="Option A" />
      </ChoiceCards>,
    );
    expect(document.body).toBeTruthy();
  });
});
