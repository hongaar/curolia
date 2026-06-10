import { describe, expect, it, vi } from "vitest";
import { openPinEditor } from "./open-pin-editor";

const pin = {
  id: "pin-1",
  map_id: "map-1",
  slug: "cafe",
  title: "Café",
} as const;

const mapRoute = { profileSlug: "me", mapSlug: "trip" };

describe("openPinEditor", () => {
  it("navigates on mobile", () => {
    const navigate = vi.fn();
    const onOpenDialog = vi.fn();
    openPinEditor({
      pin: pin as never,
      mapRoute,
      isMobile: true,
      navigate,
      onOpenDialog,
    });
    expect(navigate).toHaveBeenCalledWith("/me/trip/pin/cafe/edit");
    expect(onOpenDialog).not.toHaveBeenCalled();
  });

  it("opens dialog on wider viewports", () => {
    const navigate = vi.fn();
    const onOpenDialog = vi.fn();
    openPinEditor({
      pin: pin as never,
      mapRoute,
      isMobile: false,
      navigate,
      onOpenDialog,
    });
    expect(navigate).not.toHaveBeenCalled();
    expect(onOpenDialog).toHaveBeenCalledWith(pin);
  });
});
