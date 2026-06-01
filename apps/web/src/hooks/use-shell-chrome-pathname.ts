import { useFrozenBaseLocation } from "@/hooks/use-frozen-base-location";
import { isStackRoute } from "@/lib/stack-routes";
import { useLocation } from "react-router-dom";

/** Pathname for shell chrome (e.g. map fullscreen sidebar) while a stack covers the base. */
export function useShellChromePathname(): string {
  const { pathname } = useLocation();
  const baseLocation = useFrozenBaseLocation();

  if (isStackRoute(pathname)) {
    return baseLocation.pathname;
  }
  return pathname;
}
