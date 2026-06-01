import { useMaxSm } from "@/hooks/use-max-sm";
import { Capacitor } from "@capacitor/core";

/** Slide transitions + hide floating nav on stack screens (mobile / native). */
export function useStackTransitions(): boolean {
  const isMaxSm = useMaxSm();
  return Capacitor.isNativePlatform() || isMaxSm;
}
