import { subscribeNativeShare } from "@/lib/native-share";
import { extractUrlFromSharedText } from "@/lib/pin-form-clipboard";
import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";
import { toast } from "sonner";

/** Handle URLs shared into the native app (Android share target). */
export function useNativeShareLink(onUrl: (url: string) => void) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    return subscribeNativeShare((text) => {
      const url = extractUrlFromSharedText(text);
      if (!url) {
        toast.message("No link found in shared content.");
        return;
      }
      onUrl(url);
    });
  }, [onUrl]);
}
