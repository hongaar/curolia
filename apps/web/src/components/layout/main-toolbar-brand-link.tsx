import { mapViewHref } from "@/lib/app-paths";
import { isMapChromeRoute } from "@/lib/map-chrome";
import { normalizeMapStylePreset } from "@/lib/map-style";
import { useMap } from "@/providers/map-provider";
import {
  MainToolbarBrand,
  MainToolbarBrandAnchor,
} from "@curolia/ui/main-toolbar";
import { Link, useLocation } from "react-router-dom";

export function MainToolbarBrandLink() {
  const { pathname } = useLocation();
  const { activeMap, maps } = useMap();
  const homeMap = activeMap ?? maps[0] ?? null;
  const to = homeMap?.slug ? mapViewHref("map", homeMap.slug) : "/";
  const overlayNameTone = isMapChromeRoute(pathname)
    ? (() => {
        const preset = normalizeMapStylePreset(activeMap?.style);
        if (preset === "satellite") return "light" as const;
        if (preset === "street") return "dark" as const;
        return undefined;
      })()
    : undefined;

  return (
    <MainToolbarBrandAnchor>
      {(className) => (
        <Link to={to} className={className}>
          <MainToolbarBrand overlayNameTone={overlayNameTone} />
        </Link>
      )}
    </MainToolbarBrandAnchor>
  );
}
