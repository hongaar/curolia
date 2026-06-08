import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DropdownMenuEditRow } from "./dropdown-menu-list";

describe("dropdown-menu-list", () => {
  it("renders without crashing", () => {
    render(
      <DropdownMenuEditRow>
        <span>Item</span>
      </DropdownMenuEditRow>,
    );
    expect(document.body).toBeTruthy();
  });
});
