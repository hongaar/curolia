import { useMinMd } from "@/hooks/use-min-md";
import { mapViewSegmentFromPathname } from "@/lib/app-paths";
import { BlogPage } from "@/pages/blog-page";
import { GalleryPage } from "@/pages/gallery-page";
import { MapPage } from "@/pages/map-page";
import { useLocation } from "react-router-dom";

/**
 * Stable shell for map / blog / gallery base routes.
 * Desktop always keeps MapPage mounted when switching views; mobile uses fullscreen pages.
 */
export function MapViewRoute() {
  const isWideEnough = useMinMd();
  const { pathname } = useLocation();
  const segment = mapViewSegmentFromPathname(pathname);

  if (isWideEnough) {
    return <MapPage />;
  }

  if (segment === "blog") return <BlogPage />;
  if (segment === "gallery") return <GalleryPage />;
  return <MapPage />;
}
