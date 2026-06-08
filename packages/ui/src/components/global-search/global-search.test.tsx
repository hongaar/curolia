import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GlobalSearchIcon } from "./global-search";

describe("GlobalSearchIcon", () => {
  it("renders without crashing", () => {
    render(
      <GlobalSearchIcon>
        <span>S</span>
      </GlobalSearchIcon>,
    );
    expect(document.body).toBeTruthy();
  });
});
