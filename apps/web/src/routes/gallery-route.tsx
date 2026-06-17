import { useMinMd } from "@/hooks/use-min-md";
import { GalleryPage } from "@/pages/gallery-page";
import { MapPage } from "@/pages/map-page";

/** Mobile: fullscreen gallery. Desktop: map with gallery side panel. */
export function GalleryRoute() {
  const isWideEnough = useMinMd();
  if (isWideEnough) return <MapPage />;
  return <GalleryPage />;
}
