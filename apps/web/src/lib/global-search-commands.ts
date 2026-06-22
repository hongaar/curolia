import type { MapWithOwnerSlug } from "@/lib/app-paths";
import { mapSettingsHref, mapViewSwitchHref } from "@/lib/app-paths";
import type { ExploreCategoryId } from "@/lib/explore-categories";
import {
  EXPLORE_COMMAND_PREFIX,
  exploreCategoryFromCommandId,
} from "@/lib/explore-search-commands";
import type { GlobalSearchSelectedPin } from "@/lib/global-search-selected-pin";
import type { ShortcutBinding } from "@/lib/keyboard-shortcut";
import {
  mapRouteForMap,
  parseMapViewPathname,
  type MapRoute,
} from "@/lib/map-route";
import {
  isMapViewEnabled,
  normalizeMapViewSettings,
} from "@/lib/map-view-settings";
import { isPinDetailPagePathname } from "@/lib/pin-detail-back";
import type { NavigateFunction } from "react-router-dom";

export type GlobalSearchMapViewContext =
  | "map"
  | "blog"
  | "gallery"
  | "pin-detail";

export type GlobalSearchCommandSection = "actions" | "pages";

export type GlobalSearchCommandContext = {
  navigate: NavigateFunction;
  activeMap: MapWithOwnerSlug | null;
  selectedPin: GlobalSearchSelectedPin | null;
  canEditSelectedPin: boolean;
  canMoveSelectedPin: boolean;
  mapViewRoute: MapRoute | null;
  mapViewContext: GlobalSearchMapViewContext | null;
  locationSearch: string;
  openNewMapDialog: () => void;
  openAboutDialog: () => void;
  editSelectedPin: () => void;
  moveSelectedPin: () => void;
  deleteSelectedPin: () => void;
  signOut: () => Promise<void>;
  activateExploreCategory?: (categoryId: ExploreCategoryId) => void;
};

export function resolveGlobalSearchMapViewContext(
  pathname: string,
): GlobalSearchMapViewContext | null {
  if (isPinDetailPagePathname(pathname)) return "pin-detail";
  const mapView = parseMapViewPathname(pathname);
  if (mapView?.view === "blog") return "blog";
  if (mapView?.view === "gallery") return "gallery";
  if (mapView?.view === "map" || pathname === "/") return "map";
  return null;
}

export function canShowViewMapAction(ctx: GlobalSearchCommandContext): boolean {
  const settings = normalizeMapViewSettings(ctx.activeMap);
  return Boolean(
    ctx.mapViewRoute &&
    isMapViewEnabled(settings, "map") &&
    (ctx.mapViewContext === "blog" ||
      ctx.mapViewContext === "gallery" ||
      ctx.mapViewContext === "pin-detail"),
  );
}

export function canShowViewBlogAction(
  ctx: GlobalSearchCommandContext,
): boolean {
  const settings = normalizeMapViewSettings(ctx.activeMap);
  return Boolean(
    ctx.mapViewRoute &&
    isMapViewEnabled(settings, "blog") &&
    (ctx.mapViewContext === "map" ||
      ctx.mapViewContext === "gallery" ||
      ctx.mapViewContext === "pin-detail"),
  );
}

export function canShowViewGalleryAction(
  ctx: GlobalSearchCommandContext,
): boolean {
  const settings = normalizeMapViewSettings(ctx.activeMap);
  return Boolean(
    ctx.mapViewRoute &&
    isMapViewEnabled(settings, "gallery") &&
    (ctx.mapViewContext === "map" ||
      ctx.mapViewContext === "blog" ||
      ctx.mapViewContext === "pin-detail"),
  );
}

export type GlobalSearchCommandDef = {
  id: string;
  section: GlobalSearchCommandSection;
  title: string;
  subtitle?: string;
  keywords: readonly string[];
  shortcut?: ShortcutBinding;
  isAvailable?: (ctx: GlobalSearchCommandContext) => boolean;
};

export const GLOBAL_SEARCH_COMMANDS: readonly GlobalSearchCommandDef[] = [
  {
    id: "view-map",
    section: "actions",
    title: "View map",
    keywords: ["map", "switch", "view"],
    isAvailable: canShowViewMapAction,
  },
  {
    id: "view-blog",
    section: "actions",
    title: "View blog",
    keywords: ["blog", "list", "switch", "view"],
    isAvailable: canShowViewBlogAction,
  },
  {
    id: "view-gallery",
    section: "actions",
    title: "View gallery",
    keywords: ["gallery", "cards", "grid", "photos", "switch", "view"],
    isAvailable: canShowViewGalleryAction,
  },
  {
    id: "new-map",
    section: "actions",
    title: "New map",
    keywords: ["create", "map", "add"],
    shortcut: { key: "m", shift: true },
  },
  {
    id: "map-settings",
    section: "actions",
    title: "Map settings",
    keywords: ["map", "settings", "configure"],
    shortcut: { key: ",", shift: true },
    isAvailable: (ctx) => Boolean(ctx.activeMap?.slug?.trim()),
  },
  {
    id: "edit-pin",
    section: "actions",
    title: "Edit pin",
    keywords: ["pin", "update", "modify"],
    shortcut: { key: "e" },
    isAvailable: (ctx) => Boolean(ctx.selectedPin && ctx.canEditSelectedPin),
  },
  {
    id: "move-pin",
    section: "actions",
    title: "Move pin to another map",
    keywords: ["pin", "move", "transfer", "map"],
    shortcut: { key: "m", alt: true },
    isAvailable: (ctx) => ctx.canMoveSelectedPin,
  },
  {
    id: "delete-pin",
    section: "actions",
    title: "Delete pin",
    keywords: ["pin", "remove", "destroy", "delete"],
    shortcut: { key: "Backspace", shift: true },
    isAvailable: (ctx) => Boolean(ctx.selectedPin && ctx.canEditSelectedPin),
  },
  {
    id: "profile",
    section: "actions",
    title: "Profile",
    keywords: ["account", "user", "avatar"],
    shortcut: { key: "p", shift: true },
  },
  {
    id: "settings",
    section: "actions",
    title: "Settings",
    keywords: ["preferences", "options", "app"],
    shortcut: { key: "," },
  },
  {
    id: "plugins",
    section: "actions",
    title: "Plugins",
    keywords: ["extensions", "connectors", "integrations"],
    shortcut: { key: "l", shift: true },
  },
  {
    id: "notifications",
    section: "actions",
    title: "Notifications",
    keywords: ["alerts", "inbox", "bell"],
    shortcut: { key: "n", shift: true },
  },
  {
    id: "about",
    section: "actions",
    title: "About Curolia",
    keywords: ["help", "info", "version"],
    shortcut: { key: "/", shift: true },
  },
  {
    id: "sign-out",
    section: "actions",
    title: "Sign out",
    keywords: ["logout", "log out", "exit"],
    isAvailable: () => true,
  },
  {
    id: "contact",
    section: "pages",
    title: "Contact",
    keywords: ["email", "support", "hello"],
  },
  {
    id: "privacy",
    section: "pages",
    title: "Privacy Policy",
    keywords: ["legal", "data", "gdpr"],
  },
  {
    id: "terms",
    section: "pages",
    title: "Terms and Conditions",
    keywords: ["legal", "tos", "agreement"],
  },
  {
    id: "open-source",
    section: "pages",
    title: "Open source at Curolia",
    keywords: ["oss", "github", "community"],
  },
  {
    id: "licenses",
    section: "pages",
    title: "Open source licenses",
    keywords: ["npm", "third party", "attribution"],
  },
] as const;

export const GLOBAL_SEARCH_COMMANDS_WITH_PAGES: readonly GlobalSearchCommandDef[] =
  GLOBAL_SEARCH_COMMANDS;

const DEFAULT_EMPTY_ACTION_IDS = new Set([
  "new-map",
  "map-settings",
  "view-map",
  "view-blog",
  "view-gallery",
  "edit-pin",
  "move-pin",
  "delete-pin",
  "profile",
  "settings",
  "plugins",
  "notifications",
  "about",
]);

export function matchesGlobalSearchCommand(
  command: GlobalSearchCommandDef,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [command.title, command.subtitle, ...command.keywords]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (haystack.includes(q)) return true;
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

export function filterGlobalSearchCommands(
  commands: readonly GlobalSearchCommandDef[],
  ctx: GlobalSearchCommandContext,
  query: string,
): GlobalSearchCommandDef[] {
  const q = query.trim();
  return commands.filter((command) => {
    if (command.isAvailable && !command.isAvailable(ctx)) return false;
    if (!matchesGlobalSearchCommand(command, q)) return false;
    if (!q && command.section === "actions" && command.id === "sign-out") {
      return false;
    }
    if (
      !q &&
      command.section === "actions" &&
      command.id.startsWith(EXPLORE_COMMAND_PREFIX)
    ) {
      return ctx.mapViewContext != null;
    }
    if (
      !q &&
      command.section === "actions" &&
      !DEFAULT_EMPTY_ACTION_IDS.has(command.id)
    ) {
      return false;
    }
    return true;
  });
}

export function runGlobalSearchCommand(
  id: string,
  ctx: GlobalSearchCommandContext,
): void {
  switch (id) {
    case "new-map":
      ctx.openNewMapDialog();
      return;
    case "map-settings": {
      const map = ctx.activeMap;
      if (!map?.owner_profile_slug?.trim() || !map.slug?.trim()) return;
      ctx.navigate(mapSettingsHref(mapRouteForMap(map)));
      return;
    }
    case "view-map": {
      if (!canShowViewMapAction(ctx) || !ctx.mapViewRoute) return;
      ctx.navigate(
        mapViewSwitchHref("map", ctx.mapViewRoute, ctx.locationSearch),
      );
      return;
    }
    case "view-blog": {
      if (!canShowViewBlogAction(ctx) || !ctx.mapViewRoute) return;
      ctx.navigate(
        mapViewSwitchHref("blog", ctx.mapViewRoute, ctx.locationSearch),
      );
      return;
    }
    case "view-gallery": {
      if (!canShowViewGalleryAction(ctx) || !ctx.mapViewRoute) return;
      ctx.navigate(
        mapViewSwitchHref("gallery", ctx.mapViewRoute, ctx.locationSearch),
      );
      return;
    }
    case "profile":
      ctx.navigate("/profile");
      return;
    case "settings":
      ctx.navigate("/settings");
      return;
    case "plugins":
      ctx.navigate("/plugins");
      return;
    case "notifications":
      ctx.navigate("/notifications");
      return;
    case "edit-pin":
      if (!ctx.selectedPin) return;
      ctx.editSelectedPin();
      return;
    case "move-pin":
      if (!ctx.canMoveSelectedPin) return;
      ctx.moveSelectedPin();
      return;
    case "delete-pin":
      if (!ctx.selectedPin || !ctx.canEditSelectedPin) return;
      ctx.deleteSelectedPin();
      return;
    case "about":
      ctx.openAboutDialog();
      return;
    case "sign-out":
      void ctx.signOut();
      return;
    case "contact":
      ctx.navigate("/contact");
      return;
    case "privacy":
      ctx.navigate("/privacy");
      return;
    case "terms":
      ctx.navigate("/terms");
      return;
    case "open-source":
      ctx.navigate("/open-source");
      return;
    case "licenses":
      ctx.navigate("/licenses");
      return;
    default: {
      const categoryId = exploreCategoryFromCommandId(id);
      if (categoryId) {
        ctx.activateExploreCategory?.(categoryId);
        return;
      }
      return;
    }
  }
}

export function globalSearchCommandsWithShortcuts(
  commands: readonly GlobalSearchCommandDef[],
  ctx: GlobalSearchCommandContext,
): GlobalSearchCommandDef[] {
  return commands.filter(
    (command) =>
      command.shortcut && (!command.isAvailable || command.isAvailable(ctx)),
  );
}
