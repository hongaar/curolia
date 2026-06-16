import { useMinMd } from "@/hooks/use-min-md";
import { BlogPage } from "@/pages/blog-page";
import { MapPage } from "@/pages/map-page";

/** Mobile: fullscreen blog. Desktop: map with blog side panel. */
export function BlogRoute() {
  const isWideEnough = useMinMd();
  if (isWideEnough) return <MapPage />;
  return <BlogPage />;
}
