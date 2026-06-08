import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OptionList, OptionListItem } from "./option-list";

describe("option-list", () => {
  it("renders without crashing", () => {
    render(
      <OptionList>
        <OptionListItem>Option</OptionListItem>
      </OptionList>,
    );
    expect(document.body).toBeTruthy();
  });
});
