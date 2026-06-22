export type StaticSsrRouteId =
  | "home"
  | "contact"
  | "privacy"
  | "terms"
  | "openSource"
  | "pluginsOverview"
  | "licenses"
  | "campaign";

/** Fixed marketing/legal SSR paths — add new static pages here only. */
export const SSR_STATIC_PATHS: Record<string, StaticSsrRouteId> = {
  "/": "home",
  "/contact": "contact",
  "/privacy": "privacy",
  "/terms": "terms",
  "/open-source": "openSource",
  "/plugins-overview": "pluginsOverview",
  "/licenses": "licenses",
};

export const SSR_STATIC_PATHNAMES: readonly string[] = Object.freeze(
  Object.keys(SSR_STATIC_PATHS),
);

/** Dynamic SSR patterns (blog, pin, campaign) — static paths come from {@link SSR_STATIC_PATHNAMES}. */
export const SSR_DYNAMIC_NAVIGATE_DENYLIST: readonly RegExp[] = Object.freeze([
  /^\/api\//,
  /^\/for\/[^/]+\/?$/,
  /^\/[^/]+\/[^/]+\/blog\/?$/,
  /^\/[^/]+\/[^/]+\/pin\/[^/]+\/?$/,
]);

export function pathnameToNavigateDenylistRegex(pathname: string): RegExp {
  if (pathname === "/") return /^\/$/;
  const escaped = pathname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}\\/?$`);
}

/** Workbox navigateFallback denylist — derived from {@link SSR_STATIC_PATHNAMES}. */
export function buildSsrNavigateFallbackDenylist(): RegExp[] {
  return [
    ...SSR_STATIC_PATHNAMES.map(pathnameToNavigateDenylistRegex),
    ...SSR_DYNAMIC_NAVIGATE_DENYLIST,
  ];
}

export function isDeniedByNavigateFallback(
  pathname: string,
  denylist: readonly RegExp[] = buildSsrNavigateFallbackDenylist(),
): boolean {
  return denylist.some((pattern) => pattern.test(pathname));
}
