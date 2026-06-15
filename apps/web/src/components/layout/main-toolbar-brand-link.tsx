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
  const { activeMap } = useMap();
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
        <Link to="/" className={className}>
          <MainToolbarBrand overlayNameTone={overlayNameTone} />
        </Link>
      )}
    </MainToolbarBrandAnchor>
  );
}
