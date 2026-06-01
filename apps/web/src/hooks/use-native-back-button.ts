import { isMobileStackRoute } from "@/lib/mobile-stack-routes";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/** Android hardware back: pop stack screens or exit on root routes. */
export function useNativeBackButton() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let remove: (() => void) | undefined;

    void App.addListener("backButton", () => {
      if (isMobileStackRoute(pathname)) {
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
  }, [navigate, pathname]);
}
