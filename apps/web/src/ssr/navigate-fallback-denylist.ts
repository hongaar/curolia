import { buildSsrNavigateFallbackDenylist } from "./ssr-route-paths";

/**
 * Navigation paths that must hit the network (SSR), not the Workbox SPA shell.
 * Derived from `SSR_STATIC_PATHNAMES` in `routes.ts` — do not edit paths here.
 */
export const SSR_NAVIGATE_FALLBACK_DENYLIST =
  buildSsrNavigateFallbackDenylist();
