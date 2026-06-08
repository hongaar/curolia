import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PluginIconFrame } from "./plugin-icon-frame";

describe("plugin-icon-frame", () => {
  it("renders without crashing", () => {
    render(
      <PluginIconFrame>
        <span>P</span>
      </PluginIconFrame>,
    );
    expect(document.body).toBeTruthy();
  });
});
