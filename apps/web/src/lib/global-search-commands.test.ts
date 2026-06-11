import { describe, expect, it } from "vitest";
import {
  filterGlobalSearchCommands,
  GLOBAL_SEARCH_COMMANDS,
  matchesGlobalSearchCommand,
  resolveGlobalSearchMapViewContext,
} from "./global-search-commands";

const mapRoute = { profileSlug: "me", mapSlug: "trip" };

const baseCtx = {
  navigate: () => undefined,
  activeMap: null,
  selectedPin: null,
  canEditSelectedPin: false,
  canMoveSelectedPin: false,
  mapViewRoute: null,
  mapViewContext: null,
  locationSearch: "",
  openNewMapDialog: () => undefined,
  openAboutDialog: () => undefined,
  editSelectedPin: () => undefined,
  moveSelectedPin: () => undefined,
  deleteSelectedPin: () => undefined,
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

  const selectedPinCtx = {
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
  };

  it("shows edit pin when a pin is selected and editable", () => {
    const visible = filterGlobalSearchCommands(
      GLOBAL_SEARCH_COMMANDS,
      selectedPinCtx,
      "",
    );
    expect(visible.some((c) => c.id === "edit-pin")).toBe(true);
  });

  it("shows move and delete pin when a pin is selected and editable", () => {
    const visible = filterGlobalSearchCommands(
      GLOBAL_SEARCH_COMMANDS,
      { ...selectedPinCtx, canMoveSelectedPin: true },
      "",
    );
    expect(visible.some((c) => c.id === "move-pin")).toBe(true);
    expect(visible.some((c) => c.id === "delete-pin")).toBe(true);
  });

  it("hides move pin when there is no other map", () => {
    const visible = filterGlobalSearchCommands(
      GLOBAL_SEARCH_COMMANDS,
      selectedPinCtx,
      "",
    );
    expect(visible.some((c) => c.id === "move-pin")).toBe(false);
  });

  it("shows view blog on map routes", () => {
    const visible = filterGlobalSearchCommands(
      GLOBAL_SEARCH_COMMANDS,
      {
        ...baseCtx,
        mapViewRoute: mapRoute,
        mapViewContext: "map",
      },
      "",
    );
    expect(visible.some((c) => c.id === "view-blog")).toBe(true);
    expect(visible.some((c) => c.id === "view-map")).toBe(false);
  });

  it("shows view map on blog routes", () => {
    const visible = filterGlobalSearchCommands(
      GLOBAL_SEARCH_COMMANDS,
      {
        ...baseCtx,
        mapViewRoute: mapRoute,
        mapViewContext: "blog",
      },
      "",
    );
    expect(visible.some((c) => c.id === "view-map")).toBe(true);
    expect(visible.some((c) => c.id === "view-blog")).toBe(false);
  });

  it("shows both view actions on pin detail", () => {
    const visible = filterGlobalSearchCommands(
      GLOBAL_SEARCH_COMMANDS,
      {
        ...baseCtx,
        mapViewRoute: mapRoute,
        mapViewContext: "pin-detail",
      },
      "",
    );
    expect(visible.some((c) => c.id === "view-map")).toBe(true);
    expect(visible.some((c) => c.id === "view-blog")).toBe(true);
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

describe("resolveGlobalSearchMapViewContext", () => {
  it("detects map, blog, and pin detail routes", () => {
    expect(resolveGlobalSearchMapViewContext("/me/trip/map")).toBe("map");
    expect(resolveGlobalSearchMapViewContext("/me/trip/blog")).toBe("blog");
    expect(resolveGlobalSearchMapViewContext("/me/trip/pin/cafe")).toBe(
      "pin-detail",
    );
    expect(resolveGlobalSearchMapViewContext("/settings")).toBeNull();
  });
});
