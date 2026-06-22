/** App routes that share `/:slug` shape but are not public profile pages. */
const PUBLIC_PROFILE_SKIP_SLUGS = new Set([
  "for",
  "profile",
  "settings",
  "plugins",
  "notifications",
  "invitations",
  "whats-new",
  "map",
  "pins",
  "login",
  "signup",
  "contact",
  "privacy",
  "terms",
  "open-source",
  "plugins-overview",
  "licenses",
]);

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

const PUBLIC_PROFILE_PATH_RE = /^\/([^/]+)\/?$/;

/** Parse `/:profileSlug` when it is not a reserved app route segment. */
export function parsePublicProfilePathname(pathname: string): string | null {
  const match = PUBLIC_PROFILE_PATH_RE.exec(normalizePathname(pathname));
  if (!match?.[1]) return null;
  const profileSlug = decodeURIComponent(match[1]).trim();
  if (!profileSlug) return null;
  if (PUBLIC_PROFILE_SKIP_SLUGS.has(profileSlug.toLowerCase())) {
    return null;
  }
  return profileSlug;
}

export function isPublicProfileViewPathname(pathname: string): boolean {
  return parsePublicProfilePathname(pathname) !== null;
}

export function publicProfileHref(profileSlug: string): string {
  return `/${profileSlug.trim()}`;
}

export function profileEditHref(): string {
  return "/profile";
}
