export const DISCOVER_PATH = "/discover";

/** Stable id for discover map camera persistence in local storage. */
export const DISCOVER_MAP_STORAGE_ID = "__discover__";

export function isDiscoverPathname(pathname: string): boolean {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  return normalized === DISCOVER_PATH;
}

export function discoverHref(): string {
  return DISCOVER_PATH;
}
