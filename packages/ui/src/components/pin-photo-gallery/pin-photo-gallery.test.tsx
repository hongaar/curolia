import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PinPhotoGallery } from "./pin-photo-gallery";

describe("PinPhotoGallery", () => {
  it("renders without crashing", () => {
    render(
      <PinPhotoGallery
        items={[
          { id: "1", src: "https://example.com/photo.jpg", alt: "Photo" },
        ]}
        onOpen={() => {}}
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
