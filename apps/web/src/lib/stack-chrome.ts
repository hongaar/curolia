import { isStackRoute } from "@/lib/stack-routes";
import { Capacitor } from "@capacitor/core";

/** Matches `useStackTransitions` / `useMaxSm` (toolbar hidden on stack below this width). */
const STACK_TOOLBAR_HIDDEN_MQ = "(max-width: 639px)";

/** Mobile/native stack screens: no main toolbar, compact page top inset. */
export function isStackChromeLayout(pathname: string): boolean {
  if (!isStackRoute(pathname)) return false;
  if (Capacitor.isNativePlatform()) return true;
  if (typeof window === "undefined") return false;
  return window.matchMedia(STACK_TOOLBAR_HIDDEN_MQ).matches;
}

export function syncStackChromeDocumentClass(pathname?: string): void {
  if (typeof document === "undefined") return;
  const p = pathname ?? window.location.pathname;
  document.documentElement.classList.toggle(
    "stack-chrome",
    isStackChromeLayout(p),
  );
}

/** Keep `html.stack-chrome` in sync when the viewport crosses the stack toolbar breakpoint. */
export function installStackChromeLayoutSync(
  getPathname: () => string,
): () => void {
  const sync = () => syncStackChromeDocumentClass(getPathname());
  sync();
  const mq = window.matchMedia(STACK_TOOLBAR_HIDDEN_MQ);
  mq.addEventListener("change", sync);
  return () => mq.removeEventListener("change", sync);
}
