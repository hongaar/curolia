import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppShellLayout } from "./app-shell";

describe("AppShellLayout", () => {
  it("renders without crashing", () => {
    render(
      <AppShellLayout toolbar={<div>Toolbar</div>}>
        <div>Content</div>
      </AppShellLayout>,
    );
    expect(document.body).toBeTruthy();
  });
});
