import { mapViewHref } from "@/lib/app-paths";
import { useMap } from "@/providers/map-provider";
import {
  MainToolbarBrand,
  MainToolbarBrandAnchor,
} from "@curolia/ui/main-toolbar";
import { Link } from "react-router-dom";

export function MainToolbarBrandLink() {
  const { activeMap, maps } = useMap();
  const homeMap = activeMap ?? maps[0] ?? null;
  const to = homeMap?.slug ? mapViewHref("map", homeMap.slug) : "/";

  return (
    <MainToolbarBrandAnchor>
      {(className) => (
        <Link to={to} className={className}>
          <MainToolbarBrand />
        </Link>
      )}
    </MainToolbarBrandAnchor>
  );
}
