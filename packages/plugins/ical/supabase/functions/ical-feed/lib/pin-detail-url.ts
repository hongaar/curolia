export function pinDetailPath(
  profileSlug: string,
  mapSlug: string,
  pinSlug: string,
): string {
  return `/${profileSlug.trim()}/${mapSlug.trim()}/pin/${pinSlug.trim()}`;
}

export function absoluteAppUrl(origin: string, pathname: string): string {
  const base = origin.replace(/\/$/, "");
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${path}`;
}
