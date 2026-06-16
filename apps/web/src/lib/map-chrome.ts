import { isMapFullscreenPathname } from "@/lib/app-paths";

/** Map/blog base views (`/:profile/:map/map` or `/blog`). Stack screens keep compact app chrome. */
export function isMapChromeRoute(pathname: string): boolean {
  return isMapFullscreenPathname(pathname);
}

/** Sync `html.map-route` before React paints (avoids map layout flash on reload). */
export function syncMapRouteDocumentClass(pathname?: string): void {
  if (typeof document === "undefined") return;
  const p = pathname ?? window.location.pathname;
  document.documentElement.classList.toggle(
    "map-route",
    isMapFullscreenPathname(p),
  );
}
