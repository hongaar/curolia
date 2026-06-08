import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PluginPinCard } from "./plugin-pin";

describe("plugin-pin", () => {
  it("renders without crashing", () => {
    render(<PluginPinCard title="Pin" />);
    expect(document.body).toBeTruthy();
  });
});
