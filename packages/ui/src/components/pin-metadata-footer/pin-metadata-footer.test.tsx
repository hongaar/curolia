import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PinMetadataFooter } from "./pin-metadata-footer";

describe("pin-metadata-footer", () => {
  it("renders without crashing", () => {
    render(<PinMetadataFooter createdAt="2024-01-01" />);
    expect(document.body).toBeTruthy();
  });
});
