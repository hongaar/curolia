import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Tooltip, TooltipContent, TooltipTitle } from "./tooltip";

describe("Tooltip", () => {
  it("renders without crashing", () => {
    render(
      <Tooltip>
        <TooltipContent>
          <TooltipTitle>Tip</TooltipTitle>
        </TooltipContent>
      </Tooltip>,
    );
    expect(document.body).toBeTruthy();
  });
});
