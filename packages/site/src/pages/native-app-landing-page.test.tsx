import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { NativeAppLandingPage } from "./native-app-landing-page";

describe("NativeAppLandingPage", () => {
  it("renders without crashing", () => {
    render(
      <MemoryRouter>
        <NativeAppLandingPage />
      </MemoryRouter>,
    );
    expect(document.body).toBeTruthy();
  });
});
