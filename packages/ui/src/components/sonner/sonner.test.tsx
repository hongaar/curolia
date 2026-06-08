import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Toaster } from "./sonner";

describe("sonner", () => {
  it("renders without crashing", () => {
    render(<Toaster />);
    expect(document.body).toBeTruthy();
  });
});
