import { useFrozenBaseLocation } from "@/hooks/use-frozen-base-location";
import {
  isPinDetailPagePathname,
  pinDetailBackTarget,
} from "@/lib/pin-detail-back";
import { isStackRoute } from "@/lib/stack-routes";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { isBottomSheetHistoryState } from "@curolia/ui/bottom-sheet";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/** Android hardware back: pop stack screens or exit on base routes. */
export function useNativeBackButton() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const frozenBase = useFrozenBaseLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let remove: (() => void) | undefined;

    void App.addListener("backButton", () => {
      if (isBottomSheetHistoryState(window.history.state)) {
        window.history.back();
        return;
      }
      if (isPinDetailPagePathname(pathname)) {
        const target = pinDetailBackTarget(frozenBase);
        if (target) {
          navigate(target.href);
          return;
        }
      }
      if (isStackRoute(pathname)) {
        navigate(-1);
        return;
      }
      void App.exitApp();
    }).then((handle) => {
      remove = () => void handle.remove();
    });

    return () => {
      remove?.();
    };
  }, [frozenBase, navigate, pathname]);
}
