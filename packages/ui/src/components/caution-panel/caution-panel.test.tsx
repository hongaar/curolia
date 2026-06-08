import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CautionPanel } from "./caution-panel";

describe("caution-panel", () => {
  it("renders without crashing", () => {
    render(<CautionPanel title="Caution">Message</CautionPanel>);
    expect(document.body).toBeTruthy();
  });
});
