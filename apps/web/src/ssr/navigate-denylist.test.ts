import { describe, expect, it } from "vitest";

import { SSR_NAVIGATE_FALLBACK_DENYLIST } from "@/ssr/navigate-fallback-denylist";
import {
  buildSsrNavigateFallbackDenylist,
  isDeniedByNavigateFallback,
  isSsrPathname,
  SSR_STATIC_PATHNAMES,
} from "@/ssr/routes";

describe("SSR PWA navigateFallback denylist", () => {
  it("is built from SSR_STATIC_PATHNAMES (no manual path list drift)", () => {
    expect(SSR_NAVIGATE_FALLBACK_DENYLIST).toEqual(
      buildSsrNavigateFallbackDenylist(),
    );
  });

  it("covers every static SSR pathname", () => {
    for (const path of SSR_STATIC_PATHNAMES) {
      expect(isDeniedByNavigateFallback(path)).toBe(true);
      if (path !== "/") {
        expect(isDeniedByNavigateFallback(`${path}/`)).toBe(true);
      }
    }
  });

  it("covers representative dynamic SSR pathnames", () => {
    for (const path of [
      "/for/travel",
      "/joram/europe/blog",
      "/joram/europe/pin/paris",
    ]) {
      expect(isSsrPathname(path)).toBe(true);
      expect(isDeniedByNavigateFallback(path)).toBe(true);
    }
  });

  it("does not denylist common SPA-only routes", () => {
    for (const path of ["/login", "/settings", "/joram/europe/map"]) {
      expect(isSsrPathname(path)).toBe(false);
      expect(isDeniedByNavigateFallback(path)).toBe(false);
    }
  });
});
