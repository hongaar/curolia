import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PluginSection } from "./plugin-panel";

describe("PluginSection", () => {
  it("renders without crashing", () => {
    render(
      <PluginSection>
        <div>Section</div>
      </PluginSection>,
    );
    expect(document.body).toBeTruthy();
  });
});
