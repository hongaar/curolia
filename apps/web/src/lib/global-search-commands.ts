import type { MapWithOwnerSlug } from "@/lib/app-paths";
import { mapSettingsHref } from "@/lib/app-paths";
import type { GlobalSearchSelectedPin } from "@/lib/global-search-selected-pin";
import type { ShortcutBinding } from "@/lib/keyboard-shortcut";
import { mapRouteForMap } from "@/lib/map-route";
import type { NavigateFunction } from "react-router-dom";

export type GlobalSearchCommandSection = "actions" | "pages";

export type GlobalSearchCommandContext = {
  navigate: NavigateFunction;
  activeMap: MapWithOwnerSlug | null;
  selectedPin: GlobalSearchSelectedPin | null;
  canEditSelectedPin: boolean;
  openNewMapDialog: () => void;
  openAboutDialog: () => void;
  editSelectedPin: () => void;
  signOut: () => Promise<void>;
};

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

const DEFAULT_EMPTY_ACTION_IDS = new Set([
  "new-map",
  "map-settings",
  "edit-pin",
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
    default:
      return;
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
