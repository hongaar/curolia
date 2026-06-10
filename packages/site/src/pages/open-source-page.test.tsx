import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { OpenSourceMindsetPageContent } from "./open-source-page";

describe("OpenSourceMindsetPageContent", () => {
  it("renders without crashing", () => {
    render(
      <MemoryRouter>
        <OpenSourceMindsetPageContent />
      </MemoryRouter>,
    );
    expect(document.body).toBeTruthy();
  });
});
