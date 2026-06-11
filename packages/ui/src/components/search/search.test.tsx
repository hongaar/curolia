import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SearchIcon } from "./search";

describe("SearchIcon", () => {
  it("renders without crashing", () => {
    render(
      <SearchIcon>
        <span>S</span>
      </SearchIcon>,
    );
    expect(document.body).toBeTruthy();
  });
});
