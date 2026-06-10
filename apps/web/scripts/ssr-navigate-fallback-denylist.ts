/**
 * Navigation paths that must hit the network (SSR), not the Workbox SPA shell.
 * Keep aligned with `src/ssr/routes.ts`.
 */
export const SSR_NAVIGATE_FALLBACK_DENYLIST: RegExp[] = [
  /^\/api\//,
  /^\/$/,
  /^\/contact\/?$/,
  /^\/privacy\/?$/,
  /^\/terms\/?$/,
  /^\/licenses\/?$/,
  /^\/for\/[^/]+\/?$/,
  /^\/[^/]+\/[^/]+\/blog\/?$/,
  /^\/[^/]+\/[^/]+\/pin\/[^/]+\/?$/,
];
