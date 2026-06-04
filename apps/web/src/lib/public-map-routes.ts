/** Slug from `/map/:slug` or `/blog/:slug` when used as a public (unauthenticated) view. */
export function publicMapSlugFromPathname(pathname: string): string | null {
  const mapMatch = /^\/map\/([^/]+)\/?$/.exec(pathname);
  if (mapMatch?.[1]) return decodeURIComponent(mapMatch[1]).trim() || null;
  const blogMatch = /^\/blog\/([^/]+)\/?$/.exec(pathname);
  if (blogMatch?.[1]) return decodeURIComponent(blogMatch[1]).trim() || null;
  return null;
}

export function isPublicMapViewPathname(pathname: string): boolean {
  return publicMapSlugFromPathname(pathname) !== null;
}
