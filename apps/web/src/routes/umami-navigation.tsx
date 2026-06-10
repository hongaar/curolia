import { trackUmamiPageview } from "@/lib/umami";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/** Send Umami pageviews on in-app route changes (initial load is tracked by the script). */
export function UmamiNavigation() {
  const { pathname, search } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    const url = `${pathname}${search}`;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    void trackUmamiPageview(url);
  }, [pathname, search]);

  return null;
}
