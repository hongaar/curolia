import {
  mapViewHref,
  mapViewSegmentFromPathname,
  type MapViewSegment,
} from "@/lib/app-paths";
import { isBaseRoute } from "@/lib/stack-routes";
import type { Location } from "react-router-dom";

export type PinDetailBackTarget = {
  href: string;
  label: "Back to map" | "Back to blog" | "Back to gallery";
  view: MapViewSegment;
};

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

/** Standalone pin detail page (not the editor stack route). */
export function isPinDetailPagePathname(pathname: string): boolean {
  return /^\/[^/]+\/[^/]+\/pin\/[^/]+$/.test(normalizePathname(pathname));
}

export function locationHref(
  location: Pick<Location, "pathname" | "search" | "hash">,
): string {
  return `${location.pathname}${location.search}${location.hash}`;
}

export function pinDetailBackLabel(
  view: MapViewSegment,
): PinDetailBackTarget["label"] {
  if (view === "blog") return "Back to blog";
  if (view === "gallery") return "Back to gallery";
  return "Back to map";
}

/** Map/blog return target from the frozen stack base location. */
export function pinDetailBackTarget(
  baseLocation: Pick<Location, "pathname" | "search" | "hash">,
): PinDetailBackTarget | null {
  if (!isBaseRoute(baseLocation.pathname)) return null;
  const view = mapViewSegmentFromPathname(baseLocation.pathname);
  return {
    href: locationHref(baseLocation),
    label: pinDetailBackLabel(view),
    view,
  };
}

/** Fallback when no frozen map/blog base is available (e.g. direct pin link). */
export function pinDetailBackFallback(
  profileSlug: string,
  mapSlug: string,
  search = "",
): PinDetailBackTarget {
  const href = `${mapViewHref("map", { profileSlug, mapSlug })}${search}`;
  return { href, label: "Back to map", view: "map" };
}
