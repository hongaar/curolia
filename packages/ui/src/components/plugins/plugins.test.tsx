import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PluginListRow } from "./plugins";

describe("PluginListRow", () => {
  it("renders without crashing", () => {
    render(
      <PluginListRow>
        <div>Plugin</div>
      </PluginListRow>,
    );
    expect(document.body).toBeTruthy();
  });
});
