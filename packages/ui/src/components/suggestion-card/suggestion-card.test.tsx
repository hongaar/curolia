import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SuggestionCard } from "./suggestion-card";

describe("SuggestionCard", () => {
  it("renders without crashing", () => {
    render(<SuggestionCard title="Suggestion" description="Desc" />);
    expect(document.body).toBeTruthy();
  });
});
