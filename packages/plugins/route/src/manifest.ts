import type { PluginPackageManifest } from "@curolia/plugin-contract";
import { routeExploreCategories } from "./explore";
import { RouteIcon } from "./icon";
import { RoutePinDetailSection } from "./pin-detail-section";
import { routePluginMeta } from "./plugin-meta";

export const routePluginManifest: PluginPackageManifest = {
  id: routePluginMeta.typeId,
  displayName: routePluginMeta.displayName,
  description:
    "Route layers and outdoor path explore — hiking trails and cycling paths (OpenRouteService planned).",
  icon: RouteIcon,
  implemented: routePluginMeta.implemented,
  experimental: true,
  PinDetailSection: RoutePinDetailSection,
  exploreCategories: routeExploreCategories,
  contributions: {
    edgeFunctions: [
      {
        slug: "route",
        verifyJwt: true,
        description:
          "Generate hiking and cycling round-trip routes via OpenRouteService.",
      },
    ],
  },
};
