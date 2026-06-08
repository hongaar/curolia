import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PinPlaceMetadataRoot } from "./pin-place-metadata";

describe("PinPlaceMetadataRoot", () => {
  it("renders without crashing", () => {
    render(
      <PinPlaceMetadataRoot>
        <div>Metadata</div>
      </PinPlaceMetadataRoot>,
    );
    expect(document.body).toBeTruthy();
  });
});
