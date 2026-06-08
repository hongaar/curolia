import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ErrorBoundary } from "./error-boundary";

describe("ErrorBoundary", () => {
  it("renders without crashing", () => {
    render(
      <ErrorBoundary fallback={<div>Error</div>}>
        <div>Child</div>
      </ErrorBoundary>,
    );
    expect(document.body).toBeTruthy();
  });
});
