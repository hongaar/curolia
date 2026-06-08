import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PinFormPanelFieldGroup } from "./pin-form";

describe("PinFormPanelFieldGroup", () => {
  it("renders without crashing", () => {
    render(
      <PinFormPanelFieldGroup>
        <div>Field</div>
      </PinFormPanelFieldGroup>,
    );
    expect(document.body).toBeTruthy();
  });
});
