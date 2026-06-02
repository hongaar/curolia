import { isStackRoute } from "@/lib/stack-routes";
import { Capacitor } from "@capacitor/core";

/** Mobile/native stack screens: no main toolbar, compact page top inset. */
export function isStackChromeLayout(pathname: string): boolean {
  if (!isStackRoute(pathname)) return false;
  if (Capacitor.isNativePlatform()) return true;
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 39.99rem)").matches;
}

export function syncStackChromeDocumentClass(pathname?: string): void {
  if (typeof document === "undefined") return;
  const p = pathname ?? window.location.pathname;
  document.documentElement.classList.toggle(
    "stack-chrome",
    isStackChromeLayout(p),
  );
}
