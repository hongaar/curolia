import { syncMapRouteDocumentClass } from "@/lib/map-chrome";
import {
  installStackChromeLayoutSync,
  syncStackChromeDocumentClass,
} from "@/lib/stack-chrome";
import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/** Keeps `html.map-route` / `html.stack-chrome` in sync on every route (incl. site pages outside AppShell). */
export function DocumentRouteClasses() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    syncMapRouteDocumentClass(pathname);
    syncStackChromeDocumentClass(pathname);
  }, [pathname]);

  useEffect(() => {
    return installStackChromeLayoutSync(() => pathname);
  }, [pathname]);

  return null;
}
