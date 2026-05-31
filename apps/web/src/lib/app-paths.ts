import {
  applyAddTraceToSearchParams,
  applySelectedTraceToSearchParams,
  MAP_VIEW_PARAM,
} from "@/lib/map-view-params";
import type { Journal } from "@/types/database";

export type JournalViewSegment = "map" | "blog";

export function journalViewHref(
  view: JournalViewSegment,
  journalSlug: string,
): string {
  return `/${view}/${journalSlug}`;
}

/** Map uses the fullscreen / overlay sidebar chrome. */
export function isMapFullscreenPathname(pathname: string): boolean {
  return pathname === "/" || /^\/map\/[^/]+\/?$/.test(pathname);
}

export function journalViewSegmentFromPathname(
  pathname: string,
): JournalViewSegment {
  return pathname.startsWith("/blog/") ? "blog" : "map";
}

export function journalSwitchHref(
  nextJournal: Journal,
  currentPathname: string,
  currentSearch: string,
): string {
  const segment = journalViewSegmentFromPathname(currentPathname);
  const slug = nextJournal.slug.trim();
  const p = new URLSearchParams(
    currentSearch.startsWith("?") ? currentSearch.slice(1) : currentSearch,
  );
  p.delete("filter");
  p.delete("tags");
  p.delete(MAP_VIEW_PARAM.trace);
  p.delete(MAP_VIEW_PARAM.add);
  const q = p.toString();
  const base = journalViewHref(segment, slug);
  return q ? `${base}?${q}` : base;
}

/** Stable trace detail URL: `/traces/:journalSlug/:traceSlug`. */
export function traceDetailHref(
  journalSlug: string,
  traceSlug: string,
): string {
  return `/traces/${journalSlug.trim()}/${traceSlug.trim()}`;
}

export function mapHrefWithSearch(
  journalSlug: string,
  searchParamsStr: string,
): string {
  const p = new URLSearchParams(
    searchParamsStr.startsWith("?")
      ? searchParamsStr.slice(1)
      : searchParamsStr,
  );
  const q = p.toString();
  const base = journalViewHref("map", journalSlug);
  return q ? `${base}?${q}` : base;
}

/** Map with add-trace placement mode enabled (preserves unrelated search params). */
export function mapAddTraceHref(
  journalSlug: string,
  searchParams: URLSearchParams | string = "",
): string {
  const p =
    typeof searchParams === "string"
      ? new URLSearchParams(
          searchParams.startsWith("?") ? searchParams.slice(1) : searchParams,
        )
      : new URLSearchParams(searchParams);
  const next = applyAddTraceToSearchParams(
    applySelectedTraceToSearchParams(p, null),
    true,
  );
  const q = next.toString();
  const base = journalViewHref("map", journalSlug);
  return q ? `${base}?${q}` : base;
}
