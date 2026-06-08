import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { PrivacyPolicyPageContent, TermsPageContent } from "./legal-pages";

describe("Legal pages", () => {
  it("renders privacy policy", () => {
    render(
      <MemoryRouter>
        <PrivacyPolicyPageContent />
      </MemoryRouter>,
    );
    expect(document.body).toBeTruthy();
  });

  it("renders terms", () => {
    render(
      <MemoryRouter>
        <TermsPageContent />
      </MemoryRouter>,
    );
    expect(document.body).toBeTruthy();
  });
});
