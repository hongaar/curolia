import { useMaxSm } from "@/hooks/use-max-sm";
import { Capacitor } from "@capacitor/core";

/** Capacitor shell or mobile viewport — use push/pop stack chrome and transitions. */
export function shouldUseMobileStackLayout(
  isNativePlatform: boolean,
  isMaxSmViewport: boolean,
): boolean {
  return isNativePlatform || isMaxSmViewport;
}

export function useMobileStackLayout(): boolean {
  const isMaxSm = useMaxSm();
  return shouldUseMobileStackLayout(Capacitor.isNativePlatform(), isMaxSm);
}
