/** Routes that use push/pop stack layout on mobile (see MobileStackOutlet). */
const MOBILE_STACK_ROUTE_PATTERNS: readonly RegExp[] = [
  /^\/profile\/?$/,
  /^\/settings(?:\/.*)?$/,
  /^\/notifications\/?$/,
  /^\/invitations\/?$/,
  /^\/journals\/[^/]+\/settings\/?$/,
  /^\/traces\//,
];

export function isMobileStackRoute(pathname: string): boolean {
  return MOBILE_STACK_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

export function shouldAnimateMobileStackTransition(
  fromPathname: string,
  toPathname: string,
  navigationType: "POP" | "PUSH" | "REPLACE",
): boolean {
  if (navigationType === "REPLACE") return false;
  const fromStack = isMobileStackRoute(fromPathname);
  const toStack = isMobileStackRoute(toPathname);
  if (!fromStack && !toStack) return false;
  return true;
}

export function mobileStackTransitionDirection(
  navigationType: "POP" | "PUSH" | "REPLACE",
): "push" | "pop" {
  return navigationType === "POP" ? "pop" : "push";
}
