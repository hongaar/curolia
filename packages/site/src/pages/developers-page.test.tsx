import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { DevelopersPageContent } from "./developers-page";

describe("DevelopersPageContent", () => {
  it("shows the alpha notice and endpoints from the OpenAPI document", () => {
    render(
      <MemoryRouter>
        <DevelopersPageContent apiBaseUrl="https://example.test/api/" />
      </MemoryRouter>,
    );
    expect(screen.getByRole("note").textContent).toContain("Alpha");
    expect(screen.getAllByText("/v1/maps/{mapId}/pins")).toHaveLength(2);
    expect(screen.getByText("https://example.test/api")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "API keys" }).getAttribute("href"),
    ).toBe("/developers/keys");
  });
});

describe("DevelopersPageContent endpoint dialog", () => {
  it("opens request/response docs with examples", async () => {
    render(
      <MemoryRouter>
        <DevelopersPageContent apiBaseUrl="https://example.test" />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Create a pin/ }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain(
      "curl -X POST https://example.test/v1/maps/",
    );
    expect(dialog.textContent).toContain('"title": "Colosseum"');
    expect(dialog.textContent).toContain("Request body");
  });
});
