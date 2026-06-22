import type { PluginPackageManifest } from "@curolia/plugin-contract";
import { routeExploreCategories } from "./explore";
import { RouteIcon } from "./icon";
import { routePluginMeta } from "./plugin-meta";

export const routePluginManifest: PluginPackageManifest = {
  id: routePluginMeta.typeId,
  displayName: routePluginMeta.displayName,
  description:
    "Route layers and outdoor path explore — hiking trails and cycling paths (OpenRouteService planned).",
  icon: RouteIcon,
  implemented: routePluginMeta.implemented,
  exploreCategories: routeExploreCategories,
};
