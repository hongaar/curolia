import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DropdownMenu } from "../dropdown-menu";
import { AccountMenuTrigger } from "./floating-nav-bar";

describe("AccountMenuTrigger", () => {
  it("renders without crashing", () => {
    render(
      <DropdownMenu>
        <AccountMenuTrigger>Menu</AccountMenuTrigger>
      </DropdownMenu>,
    );
    expect(document.body).toBeTruthy();
  });
});
