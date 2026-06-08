import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { SegmentedSwitcher } from "./segmented-switcher";

describe("segmented-switcher", () => {
  it("renders without crashing", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <SegmentedSwitcher
          items={[{ to: "/", label: "Map", icon: <span>M</span> }]}
        />
      </MemoryRouter>,
    );
    expect(document.body).toBeTruthy();
  });
});
