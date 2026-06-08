import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PluginAccountPanel } from "./plugin-account";

describe("PluginAccountPanel", () => {
  it("renders without crashing", () => {
    render(
      <PluginAccountPanel>
        <div>Account</div>
      </PluginAccountPanel>,
    );
    expect(document.body).toBeTruthy();
  });
});
