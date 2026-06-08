import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { PageBackButton } from "./page-back-button";

describe("page-back-button", () => {
  it("renders without crashing", () => {
    render(
      <MemoryRouter>
        <PageBackButton to="/" />
      </MemoryRouter>,
    );
    expect(document.body).toBeTruthy();
  });
});
