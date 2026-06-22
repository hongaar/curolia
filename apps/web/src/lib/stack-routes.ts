import type { Location } from "react-router-dom";

/** Fullscreen map views — base layer; stack screens mount above these. */
const BASE_ROUTE_PATTERNS: readonly RegExp[] = [
  /^\/[^/]+\/[^/]+\/map\/?$/,
  /^\/[^/]+\/[^/]+\/blog\/?$/,
  /^\/[^/]+\/[^/]+\/gallery\/?$/,
];

/** Screens stacked above the base (settings, pin detail, …). */
const STACK_ROUTE_PATTERNS: readonly RegExp[] = [
  /^\/profile\/?$/,
  /^\/settings\/?$/,
  /^\/plugins\/?$/,
  /^\/notifications\/?$/,
  /^\/invitations\/?$/,
  /^\/whats-new\/?$/,
  /^\/(?!profile$|settings$|plugins$|notifications$|invitations$|whats-new$)[^/]+\/?$/,
  /^\/[^/]+\/[^/]+\/settings\/?$/,
  /^\/[^/]+\/[^/]+\/pin\//,
];

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function isBaseRoute(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return BASE_ROUTE_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isStackRoute(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return STACK_ROUTE_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function getStackChain(pathname: string): readonly string[] {
  const normalized = normalizePathname(pathname);
  if (!isStackRoute(normalized)) return [];

  return [normalized];
}

export function stackLocationForPathname(
  pathname: string,
  leafLocation: Location,
): Location {
  if (
    normalizePathname(pathname) === normalizePathname(leafLocation.pathname)
  ) {
    return leafLocation;
  }
  return {
    ...leafLocation,
    pathname,
    search: "",
    hash: "",
  };
}

export function orderStackPaths(paths: readonly string[]): string[] {
  if (paths.length === 0) return [];
  const deepest = paths.reduce((a, b) =>
    getStackChain(a).length >= getStackChain(b).length ? a : b,
  );
  const ordered = [...getStackChain(deepest)];
  for (const path of paths) {
    if (!ordered.includes(path)) ordered.push(path);
  }
  return ordered;
}

export function shouldAnimateStackTransition(
  fromPathname: string,
  toPathname: string,
  navigationType: "POP" | "PUSH" | "REPLACE",
): boolean {
  if (navigationType === "REPLACE") return false;
  const fromStack = isStackRoute(fromPathname);
  const toStack = isStackRoute(toPathname);
  if (!fromStack && !toStack) return false;
  return true;
}

export function stackTransitionDirection(
  navigationType: "POP" | "PUSH" | "REPLACE",
): "push" | "pop" {
  return navigationType === "POP" ? "pop" : "push";
}
