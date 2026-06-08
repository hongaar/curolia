import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Page, PageTitle } from "./page";

describe("Page", () => {
  it("renders without crashing", () => {
    render(
      <Page>
        <PageTitle>Test</PageTitle>
      </Page>,
    );
    expect(document.body).toBeTruthy();
  });
});
