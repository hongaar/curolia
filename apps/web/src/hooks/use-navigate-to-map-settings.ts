import { mapSettingsHref } from "@/lib/app-paths";
import type { MapRoute } from "@/lib/map-route";
import { useNavigate } from "react-router-dom";

export function useNavigateToMapSettings() {
  const navigate = useNavigate();
  return (route: MapRoute) => {
    if (!route.profileSlug.trim() || !route.mapSlug.trim()) return;
    void navigate(mapSettingsHref(route));
  };
}
