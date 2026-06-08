import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PinMetadataSubtitleContent } from "./pin-metadata-subtitle";

describe("PinMetadataSubtitleContent", () => {
  it("renders without crashing", () => {
    render(
      <PinMetadataSubtitleContent
        subtitle={{ parts: [{ kind: "text", text: "Open" }] }}
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
