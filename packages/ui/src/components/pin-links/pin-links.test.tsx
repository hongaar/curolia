import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PinLinksListRoot } from "./pin-links";

describe("PinLinksListRoot", () => {
  it("renders without crashing", () => {
    render(
      <PinLinksListRoot>
        <div>Links</div>
      </PinLinksListRoot>,
    );
    expect(document.body).toBeTruthy();
  });
});
