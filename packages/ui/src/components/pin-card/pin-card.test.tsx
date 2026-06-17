import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { PinCard } from "./pin-card";

describe("PinCard", () => {
  it("renders title and links to pin detail", () => {
    render(
      <MemoryRouter>
        <PinCard to="/me/trip/pin/cafe" title="Café stop" dateLabel="Jun 1" />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: /café stop/i })).toHaveAttribute(
      "href",
      "/me/trip/pin/cafe",
    );
  });
});
