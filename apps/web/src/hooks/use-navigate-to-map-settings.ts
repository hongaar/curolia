import { mapSettingsHref } from "@/lib/app-paths";
import { useNavigate } from "react-router-dom";

export function useNavigateToMapSettings() {
  const navigate = useNavigate();
  return (mapSlug: string) => {
    const slug = mapSlug.trim();
    if (!slug) return;
    void navigate(mapSettingsHref(slug));
  };
}
