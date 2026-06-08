import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BorderedList } from "./list";

describe("BorderedList", () => {
  it("renders without crashing", () => {
    render(
      <BorderedList>
        <li>Item</li>
      </BorderedList>,
    );
    expect(document.body).toBeTruthy();
  });
});
