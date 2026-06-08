import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { Button } from "../button";

describe("popover", () => {
  it("renders without crashing", () => {
    render(
      <Popover open>
        <PopoverTrigger render={<Button>Open</Button>} />
        <PopoverContent>Content</PopoverContent>
      </Popover>,
    );
    expect(document.body).toBeTruthy();
  });
});
