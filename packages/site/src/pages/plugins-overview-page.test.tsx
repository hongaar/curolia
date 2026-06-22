import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { PluginsOverviewPageContent } from "./plugins-overview-page";

describe("PluginsOverviewPageContent", () => {
  it("renders without crashing", () => {
    render(
      <MemoryRouter>
        <PluginsOverviewPageContent />
      </MemoryRouter>,
    );
    expect(document.body).toBeTruthy();
  });
});
