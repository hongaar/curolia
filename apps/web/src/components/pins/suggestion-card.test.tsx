import { SuggestionCard } from "@curolia/ui/suggestion-card";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@curolia/ui/button";

describe("SuggestionCard", () => {
  it("renders eyebrow, title, meta and the action button", () => {
    const view = render(
      <SuggestionCard
        eyebrow="Suggested · Points of interest"
        title="Café de Klos"
        meta="Restaurant · 18 m away"
        actions={
          <Button type="button" size="sm">
            Attach place
          </Button>
        }
      />,
    );

    expect(view.getByText("Café de Klos")).toBeInTheDocument();
    expect(
      view.getByText("Suggested · Points of interest"),
    ).toBeInTheDocument();
    expect(view.getByText("Restaurant · 18 m away")).toBeInTheDocument();
    expect(
      view.getByRole("button", { name: "Attach place" }),
    ).toBeInTheDocument();
  });

  it("calls onDismiss when the dismiss button is clicked", () => {
    const onDismiss = vi.fn();
    const view = render(
      <SuggestionCard title="Anne Frank House" onDismiss={onDismiss} />,
    );

    fireEvent.click(view.getByRole("button", { name: "Dismiss suggestion" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("renders a thumbnail when provided", () => {
    const view = render(
      <SuggestionCard
        title="Rijksmuseum"
        thumbnailUrl="https://example.com/thumb.jpg"
      />,
    );

    const img = view.container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("https://example.com/thumb.jpg");
  });

  it("disables the dismiss button while busy", () => {
    const view = render(
      <SuggestionCard title="Busy place" busy onDismiss={() => {}} />,
    );

    expect(
      view.getByRole("button", { name: "Dismiss suggestion" }),
    ).toBeDisabled();
  });
});
