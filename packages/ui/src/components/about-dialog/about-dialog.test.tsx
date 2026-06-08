import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AboutDialogShell } from "./about-dialog-shell";

describe("AboutDialogShell", () => {
  it("renders without crashing", () => {
    render(<AboutDialogShell />);
    expect(document.body).toBeTruthy();
  });
});
