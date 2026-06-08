import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PinPhotoThumb } from "./pin-photo-lightbox";

describe("PinPhotoThumb", () => {
  it("renders without crashing", () => {
    render(<PinPhotoThumb src="https://example.com/photo.jpg" alt="Photo" />);
    expect(document.body).toBeTruthy();
  });
});
