import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./sheet";

describe("sheet", () => {
  it("renders without crashing", () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Title</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>,
    );
    expect(document.body).toBeTruthy();
  });
});
