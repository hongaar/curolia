import { pinEditHref } from "@/lib/app-paths";
import type { MapRoute } from "@/lib/map-route";
import type { Pin } from "@/types/database";
import type { NavigateFunction } from "react-router-dom";

/** Opens the pin editor — navigates on mobile, dialog on wider viewports. */
export function openPinEditor({
  pin,
  mapRoute,
  isMobile,
  navigate,
  onOpenDialog,
}: {
  pin: Pin;
  mapRoute: MapRoute;
  isMobile: boolean;
  navigate: NavigateFunction;
  onOpenDialog: (pin: Pin) => void;
}): void {
  if (isMobile && pin.slug.trim()) {
    navigate(pinEditHref(mapRoute, pin.slug));
    return;
  }
  onOpenDialog(pin);
}
