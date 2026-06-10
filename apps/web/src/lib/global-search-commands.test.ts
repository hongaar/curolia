import { describe, expect, it } from "vitest";
import {
  filterGlobalSearchCommands,
  GLOBAL_SEARCH_COMMANDS,
  matchesGlobalSearchCommand,
} from "./global-search-commands";

const baseCtx = {
  navigate: () => undefined,
  activeMap: null,
  selectedPin: null,
  canEditSelectedPin: false,
  openNewMapDialog: () => undefined,
  openAboutDialog: () => undefined,
  editSelectedPin: () => undefined,
  signOut: async () => undefined,
};

describe("matchesGlobalSearchCommand", () => {
  it("matches title and keywords", () => {
    const settings = GLOBAL_SEARCH_COMMANDS.find((c) => c.id === "settings")!;
    expect(matchesGlobalSearchCommand(settings, "preferences")).toBe(true);
    expect(matchesGlobalSearchCommand(settings, "billing")).toBe(false);
  });
});

describe("filterGlobalSearchCommands", () => {
  it("shows default actions and pages when query is empty", () => {
    const visible = filterGlobalSearchCommands(
      GLOBAL_SEARCH_COMMANDS,
      baseCtx,
      "",
    );
    expect(visible.some((c) => c.id === "settings")).toBe(true);
    expect(visible.some((c) => c.id === "privacy")).toBe(true);
    expect(visible.some((c) => c.id === "sign-out")).toBe(false);
  });

  it("includes sign out when searching", () => {
    const visible = filterGlobalSearchCommands(
      GLOBAL_SEARCH_COMMANDS,
      baseCtx,
      "logout",
    );
    expect(visible.some((c) => c.id === "sign-out")).toBe(true);
  });

  it("hides map settings without an active map", () => {
    const visible = filterGlobalSearchCommands(
      GLOBAL_SEARCH_COMMANDS,
      baseCtx,
      "",
    );
    expect(visible.some((c) => c.id === "map-settings")).toBe(false);
  });

  it("shows edit pin when a pin is selected and editable", () => {
    const visible = filterGlobalSearchCommands(
      GLOBAL_SEARCH_COMMANDS,
      {
        ...baseCtx,
        selectedPin: {
          mapId: "map-1",
          mapRoute: { profileSlug: "me", mapSlug: "trip" },
          pin: {
            id: "pin-1",
            map_id: "map-1",
            slug: "cafe",
            title: "Café",
          } as never,
        },
        canEditSelectedPin: true,
      },
      "",
    );
    expect(visible.some((c) => c.id === "edit-pin")).toBe(true);
  });

  it("does not list invitations", () => {
    const visible = filterGlobalSearchCommands(
      GLOBAL_SEARCH_COMMANDS,
      baseCtx,
      "invite",
    );
    expect(visible.some((c) => c.id === "invitations")).toBe(false);
  });
});
