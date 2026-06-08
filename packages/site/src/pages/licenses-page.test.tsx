import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { OpenSourceLicensesPageContent } from "./licenses-page";

describe("OpenSourceLicensesPageContent", () => {
  it("renders without crashing", () => {
    render(
      <MemoryRouter>
        <OpenSourceLicensesPageContent />
      </MemoryRouter>,
    );
    expect(document.body).toBeTruthy();
  });
});
