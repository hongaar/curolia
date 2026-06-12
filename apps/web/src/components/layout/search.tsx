import { useMapMemberRole } from "@/hooks/use-map-access";
import { useMaxSm } from "@/hooks/use-max-sm";
import type { MapWithOwnerSlug } from "@/lib/app-paths";
import {
  mapHrefWithSearch,
  mapSwitchHref,
  pinDetailHref,
} from "@/lib/app-paths";
import {
  filterGlobalSearchCommands,
  GLOBAL_SEARCH_COMMANDS,
  globalSearchCommandsWithShortcuts,
  resolveGlobalSearchMapViewContext,
  runGlobalSearchCommand,
  type GlobalSearchCommandDef,
} from "@/lib/global-search-commands";
import {
  fetchGlobalSearchSelectedPin,
  parseSelectedPinLookup,
} from "@/lib/global-search-selected-pin";
import {
  formatShortcutKeys,
  formatShortcutLabel,
  isEditableKeyboardTarget,
  matchesShortcut,
} from "@/lib/keyboard-shortcut";
import { mapRouteForMap, parseMapRoutePathname } from "@/lib/map-route";
import {
  applyMapBboxToSearchParams,
  applyMapCameraToSearchParams,
  applySelectedPinToSearchParams,
  normalizeCameraForUrl,
  parseMapBboxFromSearchParams,
  parseMapCameraFromSearchParams,
  PIN_FOCUS_ZOOM,
  stripMapBboxFromSearchParams,
} from "@/lib/map-view-params";
import { openPinEditor } from "@/lib/open-pin-editor";
import { placeHighlightFitBbox } from "@/lib/pin-map-place-highlight";
import {
  pinSearchMarkerVisual,
  searchPinsInMaps,
  sortPinsByPreferredMap,
  type PinSearchRow,
} from "@/lib/pin-text-search";
import { placeCategorySearchIcon } from "@/lib/place-category-search-icon";
import { useAuth } from "@/providers/auth-provider";
import { useGlobalSearchPlace } from "@/providers/global-search-place-provider";
import { useMap } from "@/providers/map-provider";
import { useNavigationShell } from "@/providers/navigation-shell-provider";
import {
  pinLocationLabel,
  placeSearchPanelDetails,
  placeSearchPanelSubtitle,
  searchPlaces,
  type PlaceSearchResult,
} from "@curolia/services/geocoding";
import { Button } from "@curolia/ui/button";
import { MapMarker } from "@curolia/ui/map-marker";
import { PageBackButton } from "@curolia/ui/page-back-button";
import { Popover } from "@curolia/ui/popover";
import {
  SearchActivePanel,
  SearchActivePanelActions,
  SearchActivePanelBody,
  SearchActivePanelDetail,
  SearchActivePanelDetails,
  SearchActivePanelHeader,
  SearchActivePanelIcon,
  SearchActivePanelNav,
  SearchActivePanelSubtitle,
  SearchActivePanelTitle,
  SearchActivePanelTitleRow,
  SearchEmptyHint,
  SearchIcon as SearchFieldIcon,
  SearchInput,
  SearchPopoverContent,
  SearchPopoverTitle,
  SearchResultBody,
  SearchResultCategory,
  SearchResultEnd,
  SearchResultIcon,
  SearchResultRow,
  SearchResults,
  SearchResultShortcut,
  SearchResultSubtitle,
  SearchResultTitle,
  SearchResultTitleRow,
  SearchResultTrailing,
  SearchSectionLabel,
  SearchSpinner,
  SearchStatusText,
  SearchToolbarActions,
  SearchToolbarAnchor,
  SearchToolbarField,
  SearchToolbarShortcutHint,
  useSearchListKeyboard,
  type SearchListKeyboardItem,
} from "@curolia/ui/search";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRightLeft,
  Bell,
  BookOpen,
  FileText,
  Info,
  Loader2,
  LogOut,
  Mail,
  Map as MapIcon,
  MapPlus,
  Notebook,
  Pencil,
  Plug,
  Search as SearchGlyph,
  Settings,
  Settings2,
  Trash2,
  User,
  X,
} from "lucide-react";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useMatch, useNavigate } from "react-router-dom";

const DEBOUNCE_MS = 320;
const SEARCH_SHORTCUT_KEYS = formatShortcutKeys({ key: "k" });
const SEARCH_SHORTCUT_LABEL = formatShortcutLabel({ key: "k" });
const SEARCH_LISTBOX_ID = "curolia-search-listbox";
const PLACE_URL_COORD_EPSILON = 1e-4;

function placeSearchMatchesMapUrl(
  place: PlaceSearchResult,
  search: string,
): boolean {
  const params = new URLSearchParams(search);
  if (parseMapBboxFromSearchParams(params) != null) return true;
  const camera = parseMapCameraFromSearchParams(params);
  if (!camera) return false;
  return (
    Math.abs(camera.lat - place.lat) < PLACE_URL_COORD_EPSILON &&
    Math.abs(camera.lng - place.lng) < PLACE_URL_COORD_EPSILON
  );
}

const PinFormDialog = lazy(() =>
  import("@/components/pins/pin-form-dialog").then((m) => ({
    default: m.PinFormDialog,
  })),
);

type PinDialogAction = "edit" | "move" | "delete";

const COMMAND_ICONS: Record<string, ReactNode> = {
  "new-map": <MapPlus />,
  "map-settings": <Settings />,
  "view-map": <MapIcon />,
  "view-blog": <BookOpen />,
  "edit-pin": <Pencil />,
  "move-pin": <ArrowRightLeft />,
  "delete-pin": <Trash2 />,
  profile: <User />,
  settings: <Settings2 />,
  plugins: <Plug />,
  notifications: <Bell />,
  about: <Info />,
  "sign-out": <LogOut />,
  contact: <Mail />,
  privacy: <FileText />,
  terms: <FileText />,
  "open-source": <FileText />,
  licenses: <FileText />,
};

function mapTitle(pin: PinSearchRow, mapById: Map<string, MapWithOwnerSlug>) {
  return mapById.get(pin.map_id)?.name ?? "Map";
}

function pinPrimaryLabel(t: PinSearchRow): string {
  const title = t.title?.trim();
  if (title) return title;
  const place = pinLocationLabel(t)?.trim();
  if (place) return place;
  const desc = t.description?.trim();
  if (desc) return desc.length > 72 ? `${desc.slice(0, 72)}…` : desc;
  return "Untitled pin";
}

type ResultButtonProps = {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  categoryLabel?: string;
  trailing?: ReactNode;
  shortcutKeys?: string[];
  onPick: () => void;
  id?: string;
  active?: boolean;
  selected?: boolean;
  onMouseMove?: () => void;
};

function ResultRow({
  icon,
  title,
  subtitle,
  categoryLabel,
  trailing,
  shortcutKeys,
  onPick,
  id,
  active = false,
  selected = false,
  onMouseMove,
}: ResultButtonProps) {
  const end =
    trailing || shortcutKeys ? (
      <SearchResultEnd>
        {trailing ? (
          <SearchResultTrailing>{trailing}</SearchResultTrailing>
        ) : null}
        {shortcutKeys ? <SearchResultShortcut keys={shortcutKeys} /> : null}
      </SearchResultEnd>
    ) : null;

  return (
    <SearchResultRow
      id={id}
      active={active}
      selected={selected}
      onMouseMove={onMouseMove}
      onClick={onPick}
    >
      {icon ? <SearchResultIcon>{icon}</SearchResultIcon> : null}
      <SearchResultBody>
        <SearchResultTitleRow>
          <SearchResultTitle>{title}</SearchResultTitle>
          {categoryLabel ? (
            <SearchResultCategory>{categoryLabel}</SearchResultCategory>
          ) : null}
        </SearchResultTitleRow>
        {subtitle ? (
          <SearchResultSubtitle>{subtitle}</SearchResultSubtitle>
        ) : null}
      </SearchResultBody>
      {end}
    </SearchResultRow>
  );
}

export function Search() {
  const navigate = useNavigate();
  const location = useLocation();
  const homeMatch = useMatch({ path: "/", end: true });
  const nestedMapMatch = useMatch("/:profileSlug/:mapSlug/map");
  const isMapRoute = Boolean(homeMatch || nestedMapMatch);
  const { maps, activeMapId, activeMap, publicView } = useMap();
  const { canEdit: memberCanEdit } = useMapMemberRole(activeMapId);
  const canEditMap = !publicView && memberCanEdit;
  const {
    selectedPlace,
    selectPlace,
    clearSelectedPlace,
    requestAddPinFromSelectedPlace,
  } = useGlobalSearchPlace();
  const { signOut } = useAuth();
  const { openNewMapDialog, openAboutDialog } = useNavigationShell();
  const isMobile = useMaxSm();

  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [pinDialog, setPinDialog] = useState<{
    action: PinDialogAction;
    pinId: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** Debounced query to restore when dismissing the active place panel. */
  const [queryBeforePlacePick, setQueryBeforePlacePick] = useState<
    string | null
  >(null);

  const selectedPinLookup = useMemo(
    () =>
      parseSelectedPinLookup(
        location.pathname,
        location.search,
        maps,
        activeMap,
      ),
    [location.pathname, location.search, maps, activeMap],
  );

  const selectedPinQuery = useQuery({
    queryKey: [
      "global-search-selected-pin",
      selectedPinLookup?.mapId,
      selectedPinLookup?.pinToken,
    ],
    queryFn: () => fetchGlobalSearchSelectedPin(selectedPinLookup!),
    enabled: selectedPinLookup != null,
  });

  const selectedPin = selectedPinQuery.data ?? null;
  const { canEdit: memberCanEditSelectedPin } = useMapMemberRole(
    selectedPinLookup?.mapId ?? selectedPin?.mapId,
  );
  const canEditSelectedPin = !publicView && memberCanEditSelectedPin;
  const canMoveSelectedPin = Boolean(
    selectedPin &&
    canEditSelectedPin &&
    maps.some((map) => map.id !== selectedPin.pin.map_id),
  );

  const editSelectedPin = useCallback(() => {
    if (!selectedPin) return;
    openPinEditor({
      pin: selectedPin.pin,
      mapRoute: selectedPin.mapRoute,
      isMobile,
      navigate,
      onOpenDialog: () =>
        setPinDialog({ action: "edit", pinId: selectedPin.pin.id }),
    });
  }, [isMobile, navigate, selectedPin]);

  const moveSelectedPin = useCallback(() => {
    if (!canMoveSelectedPin || !selectedPin) return;
    setPinDialog({ action: "move", pinId: selectedPin.pin.id });
  }, [canMoveSelectedPin, selectedPin]);

  const deleteSelectedPin = useCallback(() => {
    if (!selectedPin || !canEditSelectedPin) return;
    setPinDialog({ action: "delete", pinId: selectedPin.pin.id });
  }, [canEditSelectedPin, selectedPin]);

  const selectedPinId = selectedPin?.pin.id ?? null;
  const pinDialogAction =
    pinDialog && selectedPinId && pinDialog.pinId === selectedPinId
      ? pinDialog.action
      : null;

  const mapViewContext = useMemo(
    () => resolveGlobalSearchMapViewContext(location.pathname),
    [location.pathname],
  );

  const mapViewRoute = useMemo(() => {
    const fromPath = parseMapRoutePathname(location.pathname);
    if (fromPath) return fromPath;
    if (activeMap?.owner_profile_slug?.trim() && activeMap.slug?.trim()) {
      return mapRouteForMap(activeMap);
    }
    return null;
  }, [activeMap, location.pathname]);

  const commandContext = useMemo(
    () => ({
      navigate,
      activeMap,
      selectedPin,
      canEditSelectedPin,
      canMoveSelectedPin,
      mapViewRoute,
      mapViewContext,
      locationSearch: location.search,
      openNewMapDialog,
      openAboutDialog,
      editSelectedPin,
      moveSelectedPin,
      deleteSelectedPin,
      signOut,
    }),
    [
      navigate,
      activeMap,
      selectedPin,
      canEditSelectedPin,
      canMoveSelectedPin,
      mapViewRoute,
      mapViewContext,
      location.search,
      openNewMapDialog,
      openAboutDialog,
      editSelectedPin,
      moveSelectedPin,
      deleteSelectedPin,
      signOut,
    ],
  );

  const dismissPopover = useCallback(() => {
    setOpen(false);
    setFocused(false);
  }, []);

  const stripPlaceHighlightFromUrl = useCallback(() => {
    if (!isMapRoute) return;
    const map = maps.find((j) => j.id === activeMapId) ?? maps[0] ?? null;
    if (!map?.owner_profile_slug || !map.slug?.trim()) return;
    const route = mapRouteForMap(map);
    const params = stripMapBboxFromSearchParams(
      new URLSearchParams(location.search),
    );
    const q = params.toString();
    navigate(mapHrefWithSearch(route, q ? `?${q}` : ""), { replace: true });
  }, [activeMapId, isMapRoute, location.search, maps, navigate]);

  const clearSelectedPlaceHighlight = useCallback(() => {
    clearSelectedPlace();
    stripPlaceHighlightFromUrl();
  }, [clearSelectedPlace, stripPlaceHighlightFromUrl]);

  const dismissActivePlacePanel = useCallback(() => {
    clearSelectedPlaceHighlight();
    if (queryBeforePlacePick != null) {
      setInput(queryBeforePlacePick);
      setDebounced(queryBeforePlacePick);
      setQueryBeforePlacePick(null);
    }
    setOpen(true);
  }, [clearSelectedPlaceHighlight, queryBeforePlacePick]);

  const selectedPlaceRef = useRef(selectedPlace);
  useLayoutEffect(() => {
    selectedPlaceRef.current = selectedPlace;
  }, [selectedPlace]);

  // Camera idle sync uses replaceState — only browser back/forward fires popstate.
  useEffect(() => {
    if (!isMapRoute) return;

    const onPopState = () => {
      const place = selectedPlaceRef.current;
      if (!place) return;
      if (!placeSearchMatchesMapUrl(place, window.location.search)) {
        clearSelectedPlace();
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [clearSelectedPlace, isMapRoute]);

  const dismissSearchAfterPick = useCallback(() => {
    dismissPopover();
    setInput("");
    setDebounced("");
    clearSelectedPlace();
  }, [clearSelectedPlace, dismissPopover]);

  const clearSearch = useCallback(() => {
    dismissSearchAfterPick();
    setQueryBeforePlacePick(null);
    if (selectedPlace) {
      stripPlaceHighlightFromUrl();
    }
  }, [dismissSearchAfterPick, selectedPlace, stripPlaceHighlightFromUrl]);

  const dismissPlaceSearchFromMap = useCallback(() => {
    clearSelectedPlaceHighlight();
    setQueryBeforePlacePick(null);
    dismissPopover();
  }, [clearSelectedPlaceHighlight, dismissPopover]);

  useEffect(() => {
    if (open) return;
    inputRef.current?.blur();
  }, [open]);

  const runCommand = useCallback(
    (command: GlobalSearchCommandDef) => {
      runGlobalSearchCommand(command.id, commandContext);
      dismissSearchAfterPick();
    },
    [commandContext, dismissSearchAfterPick],
  );

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(input.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [input]);

  useEffect(() => {
    const shortcutCommands = globalSearchCommandsWithShortcuts(
      GLOBAL_SEARCH_COMMANDS,
      commandContext,
    );

    const onKey = (e: KeyboardEvent) => {
      if (matchesShortcut(e, { key: "k" })) {
        e.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
        return;
      }

      if (isEditableKeyboardTarget(e.target)) return;

      for (const command of shortcutCommands) {
        if (!command.shortcut) continue;
        if (matchesShortcut(e, command.shortcut)) {
          e.preventDefault();
          runGlobalSearchCommand(command.id, commandContext);
          clearSearch();
          return;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearSearch, commandContext]);

  const mapIds = useMemo(() => maps.map((j) => j.id), [maps]);
  const mapIdsKey = useMemo(() => [...mapIds].sort().join(","), [mapIds]);
  const mapById = useMemo(() => new Map(maps.map((j) => [j.id, j])), [maps]);

  const mapMatches = useMemo(() => {
    const q = debounced.toLowerCase();
    if (q.length < 1) return [];
    return maps
      .filter((j) => j.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const as = a.id === activeMapId ? 0 : 1;
        const bs = b.id === activeMapId ? 0 : 1;
        if (as !== bs) return as - bs;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 12);
  }, [debounced, maps, activeMapId]);

  const pinsQuery = useQuery({
    queryKey: ["global-search-pins", debounced, mapIdsKey],
    queryFn: () => searchPinsInMaps(mapIds, debounced),
    enabled:
      open && !selectedPlace && debounced.length >= 2 && mapIds.length > 0,
  });

  const placesQuery = useQuery({
    queryKey: ["global-search-places", debounced],
    queryFn: () => searchPlaces(debounced),
    enabled:
      open && isMapRoute && debounced.length >= 2 && selectedPlace == null,
    staleTime: 60_000,
  });

  const pinsSorted = useMemo(() => {
    const rows = pinsQuery.data ?? [];
    return sortPinsByPreferredMap(rows, activeMapId);
  }, [pinsQuery.data, activeMapId]);

  const onPickMap = useCallback(
    (j: MapWithOwnerSlug) => {
      if (!j.slug.trim()) return;
      navigate(mapSwitchHref(j, location.pathname, location.search));
      dismissSearchAfterPick();
    },
    [dismissSearchAfterPick, location.pathname, location.search, navigate],
  );

  const onPickPin = useCallback(
    (t: PinSearchRow) => {
      if (isMapRoute) {
        const map = mapById.get(t.map_id);
        if (!map?.owner_profile_slug || !map.slug?.trim()) {
          dismissSearchAfterPick();
          return;
        }
        const route = mapRouteForMap(map);
        const withPin = applySelectedPinToSearchParams(
          new URLSearchParams(),
          t.slug,
        );
        const params = applyMapCameraToSearchParams(
          withPin,
          normalizeCameraForUrl({
            lat: t.lat,
            lng: t.lng,
            zoom: PIN_FOCUS_ZOOM,
          }),
        );
        navigate(mapHrefWithSearch(route, `?${params.toString()}`));
      } else {
        const map = mapById.get(t.map_id);
        if (!map?.owner_profile_slug || !map.slug?.trim()) {
          navigate("/");
          dismissSearchAfterPick();
          return;
        }
        navigate(pinDetailHref(mapRouteForMap(map), t.slug));
      }
      dismissSearchAfterPick();
    },
    [dismissSearchAfterPick, isMapRoute, mapById, navigate],
  );

  const onPickPlace = useCallback(
    (p: PlaceSearchResult) => {
      const map = maps.find((j) => j.id === activeMapId) ?? maps[0] ?? null;
      if (!map?.owner_profile_slug || !map.slug?.trim()) {
        dismissSearchAfterPick();
        return;
      }
      const route = mapRouteForMap(map);
      let params = new URLSearchParams(location.search);
      const fitBbox = placeHighlightFitBbox({
        lng: p.lng,
        lat: p.lat,
        bbox: p.bbox,
      });
      params = applyMapBboxToSearchParams(params, fitBbox);
      params = applyMapCameraToSearchParams(
        params,
        normalizeCameraForUrl({
          lat: p.lat,
          lng: p.lng,
          zoom: 12,
        }),
      );
      selectPlace(p);
      setInput(p.primaryName);
      setDebounced(p.primaryName);
      setOpen(true);
      navigate(mapHrefWithSearch(route, `?${params.toString()}`));
    },
    [
      activeMapId,
      dismissSearchAfterPick,
      location.search,
      maps,
      navigate,
      selectPlace,
    ],
  );

  const rememberQueryAndPickPlace = useCallback(
    (place: PlaceSearchResult) => {
      setQueryBeforePlacePick(debounced);
      onPickPlace(place);
    },
    [debounced, onPickPlace],
  );

  const commandMatches = useMemo(
    () =>
      filterGlobalSearchCommands(
        GLOBAL_SEARCH_COMMANDS,
        commandContext,
        debounced,
      ),
    [commandContext, debounced],
  );
  const actionMatches = useMemo(
    () => commandMatches.filter((command) => command.section === "actions"),
    [commandMatches],
  );
  const pageMatches = useMemo(
    () => commandMatches.filter((command) => command.section === "pages"),
    [commandMatches],
  );

  const showPlaces =
    isMapRoute && debounced.length >= 2 && selectedPlace == null;
  const showPins = debounced.length >= 2;
  const showMapSearch = debounced.length >= 1;
  const busy =
    (showPins && pinsQuery.isFetching) ||
    (showPlaces && placesQuery.isFetching);
  const showToolbarShortcutHint =
    input.length === 0 && !busy && selectedPlace == null;
  const showToolbarClearButton = selectedPlace != null;

  const selectableItems = useMemo((): SearchListKeyboardItem[] => {
    const items: SearchListKeyboardItem[] = [];

    for (const command of actionMatches) {
      items.push({
        id: `action-${command.id}`,
        onSelect: () => runCommand(command),
      });
    }
    for (const command of pageMatches) {
      items.push({
        id: `page-${command.id}`,
        onSelect: () => runCommand(command),
      });
    }
    if (showMapSearch) {
      for (const map of mapMatches) {
        items.push({
          id: `map-${map.id}`,
          onSelect: () => onPickMap(map),
        });
      }
    }
    if (showPins && !pinsQuery.isError && pinsSorted.length > 0) {
      for (const pin of pinsSorted) {
        items.push({
          id: `pin-${pin.id}`,
          onSelect: () => onPickPin(pin),
        });
      }
    }
    if (
      showPlaces &&
      !placesQuery.isError &&
      (placesQuery.data?.length ?? 0) > 0
    ) {
      for (const place of placesQuery.data ?? []) {
        items.push({
          id: `place-${place.id}`,
          onSelect: () => rememberQueryAndPickPlace(place),
        });
      }
    }

    return items;
  }, [
    actionMatches,
    pageMatches,
    showMapSearch,
    mapMatches,
    showPins,
    pinsQuery.isError,
    pinsSorted,
    showPlaces,
    placesQuery.isError,
    placesQuery.data,
    runCommand,
    onPickMap,
    onPickPin,
    rememberQueryAndPickPlace,
  ]);

  const {
    handleInputKeyDown: handleSearchListKeyDown,
    getItemProps,
    inputProps: searchListInputProps,
  } = useSearchListKeyboard({
    listboxId: SEARCH_LISTBOX_ID,
    items: selectableItems,
    enabled: open && selectedPlace == null,
  });

  const itemIndexById = useMemo(() => {
    const map = new Map<string, number>();
    selectableItems.forEach((item, index) => map.set(item.id, index));
    return map;
  }, [selectableItems]);

  function resultRowProps(itemId: string) {
    const index = itemIndexById.get(itemId);
    if (index == null) return {};
    return getItemProps(index);
  }

  const searchResults = (
    <>
      <SearchResults id={SEARCH_LISTBOX_ID}>
        {debounced.length === 0 ? (
          <SearchEmptyHint>
            Search {isMapRoute ? "for places on the map" : ""} and across all
            your pins
          </SearchEmptyHint>
        ) : null}

        {actionMatches.length > 0 ? (
          <>
            <SearchSectionLabel>Actions</SearchSectionLabel>
            {actionMatches.map((command) => {
              const itemId = `action-${command.id}`;
              const rowProps = resultRowProps(itemId);
              return (
                <ResultRow
                  key={command.id}
                  icon={COMMAND_ICONS[command.id] ?? <SearchGlyph />}
                  title={command.title}
                  subtitle={command.subtitle}
                  shortcutKeys={
                    command.shortcut
                      ? formatShortcutKeys(command.shortcut)
                      : undefined
                  }
                  onPick={() => runCommand(command)}
                  {...rowProps}
                />
              );
            })}
          </>
        ) : null}

        {pageMatches.length > 0 ? (
          <>
            <SearchSectionLabel>Pages</SearchSectionLabel>
            {pageMatches.map((command) => {
              const itemId = `page-${command.id}`;
              const rowProps = resultRowProps(itemId);
              return (
                <ResultRow
                  key={command.id}
                  icon={COMMAND_ICONS[command.id] ?? <FileText />}
                  title={command.title}
                  subtitle={command.subtitle}
                  onPick={() => runCommand(command)}
                  {...rowProps}
                />
              );
            })}
          </>
        ) : null}

        {showMapSearch && mapMatches.length > 0 ? (
          <>
            <SearchSectionLabel>Maps</SearchSectionLabel>
            {mapMatches.map((j) => {
              const itemId = `map-${j.id}`;
              const rowProps = resultRowProps(itemId);
              return (
                <ResultRow
                  key={j.id}
                  icon={<Notebook />}
                  title={j.name}
                  subtitle={j.is_public ? "Public" : undefined}
                  onPick={() => onPickMap(j)}
                  {...rowProps}
                />
              );
            })}
          </>
        ) : null}

        {showMapSearch &&
        mapMatches.length === 0 &&
        debounced.length < 2 &&
        actionMatches.length === 0 &&
        pageMatches.length === 0 ? (
          <SearchStatusText>
            No maps match. Add another letter to search pins
            {isMapRoute ? " and places" : ""}.
          </SearchStatusText>
        ) : null}

        {showPins ? (
          <>
            <SearchSectionLabel>Pins</SearchSectionLabel>
            {pinsQuery.isError ? (
              <SearchStatusText>Could not load pins.</SearchStatusText>
            ) : pinsQuery.isFetching && pinsSorted.length === 0 ? (
              <SearchStatusText>Searching…</SearchStatusText>
            ) : pinsSorted.length === 0 ? (
              <SearchStatusText>No matching pins.</SearchStatusText>
            ) : (
              pinsSorted.map((t) => {
                const itemId = `pin-${t.id}`;
                const rowProps = resultRowProps(itemId);
                const marker = pinSearchMarkerVisual(t);
                return (
                  <ResultRow
                    key={t.id}
                    title={pinPrimaryLabel(t)}
                    subtitle={mapTitle(t, mapById)}
                    trailing={
                      <MapMarker
                        size="sm"
                        emoji={marker.emoji}
                        fill={marker.fill}
                      />
                    }
                    onPick={() => onPickPin(t)}
                    {...rowProps}
                  />
                );
              })
            )}
          </>
        ) : null}

        {showPlaces ? (
          <>
            <SearchSectionLabel>Places</SearchSectionLabel>
            {placesQuery.isError ? (
              <SearchStatusText>Could not load places.</SearchStatusText>
            ) : placesQuery.isFetching &&
              (placesQuery.data?.length ?? 0) === 0 ? (
              <SearchStatusText>Searching…</SearchStatusText>
            ) : (placesQuery.data?.length ?? 0) === 0 ? (
              <SearchStatusText>No matching places.</SearchStatusText>
            ) : (
              (placesQuery.data ?? []).map((p) => {
                const primary = p.primaryName.trim();
                const full = p.fullLabel.trim();
                const subtitle = full && full !== primary ? full : undefined;
                const itemId = `place-${p.id}`;
                const rowProps = resultRowProps(itemId);
                return (
                  <ResultRow
                    key={p.id}
                    title={primary || full || "Place"}
                    subtitle={subtitle}
                    categoryLabel={p.categoryLabel}
                    trailing={placeCategorySearchIcon(p.categoryLabel)}
                    onPick={() => rememberQueryAndPickPlace(p)}
                    {...rowProps}
                  />
                );
              })
            )}
          </>
        ) : null}
      </SearchResults>
    </>
  );

  const activePlacePanel = selectedPlace ? (
    <SearchActivePanel>
      <SearchActivePanelNav>
        <span onMouseDown={(e) => e.preventDefault()}>
          <PageBackButton
            label="Back"
            onClick={() => dismissActivePlacePanel()}
          />
        </span>
      </SearchActivePanelNav>
      <SearchActivePanelHeader>
        <SearchActivePanelTitleRow>
          <SearchActivePanelTitle>
            {selectedPlace.primaryName.trim() || "Place"}
          </SearchActivePanelTitle>
          {selectedPlace.categoryLabel ? (
            <SearchResultCategory>
              {selectedPlace.categoryLabel}
            </SearchResultCategory>
          ) : null}
        </SearchActivePanelTitleRow>
        <SearchActivePanelIcon>
          {placeCategorySearchIcon(selectedPlace.categoryLabel)}
        </SearchActivePanelIcon>
      </SearchActivePanelHeader>
      {(() => {
        const subtitle = placeSearchPanelSubtitle(selectedPlace);
        const details = placeSearchPanelDetails(selectedPlace);
        if (!subtitle && details.length === 0) return null;
        return (
          <SearchActivePanelBody>
            {subtitle ? (
              <SearchActivePanelSubtitle>{subtitle}</SearchActivePanelSubtitle>
            ) : null}
            {details.length > 0 ? (
              <SearchActivePanelDetails>
                {details.map((detail) => (
                  <SearchActivePanelDetail
                    key={detail.label}
                    label={detail.label}
                  >
                    {detail.value}
                  </SearchActivePanelDetail>
                ))}
              </SearchActivePanelDetails>
            ) : null}
          </SearchActivePanelBody>
        );
      })()}
      {canEditMap && isMapRoute ? (
        <SearchActivePanelActions>
          <Button
            type="button"
            variant="default"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              requestAddPinFromSelectedPlace();
            }}
          >
            Add pin
          </Button>
        </SearchActivePanelActions>
      ) : null}
    </SearchActivePanel>
  ) : null;

  return (
    <>
      {pinDialogAction && selectedPin ? (
        <Suspense fallback={null}>
          <PinFormDialog
            key={`${selectedPin.pin.id}:${pinDialogAction}`}
            open
            onOpenChange={(next) => {
              if (!next) setPinDialog(null);
            }}
            mapId={selectedPin.pin.map_id}
            pin={selectedPin.pin}
            focusAction={
              pinDialogAction === "move" || pinDialogAction === "delete"
                ? pinDialogAction
                : undefined
            }
          />
        </Suspense>
      ) : null}
      <Popover
        open={open}
        modal={false}
        onOpenChange={(next) => {
          if (!next && document.activeElement === inputRef.current) {
            // Suppress spurious close: Base UI fires onOpenChange(false) when the
            // user clicks the anchor (outside the popup DOM). Since the input is
            // still focused this is not a genuine outside-click dismiss.
            return;
          }
          if (!next) {
            if (selectedPlace) {
              dismissPlaceSearchFromMap();
              return;
            }
            clearSearch();
            return;
          }
          setOpen(true);
        }}
      >
        <SearchToolbarAnchor
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) {
              inputRef.current?.focus();
            }
          }}
        >
          <SearchToolbarField focused={focused}>
            <SearchFieldIcon>
              <SearchGlyph aria-hidden />
            </SearchFieldIcon>
            <SearchInput
              ref={inputRef}
              value={input}
              onChange={(e) => {
                const value = e.target.value;
                if (selectedPlace && value !== selectedPlace.primaryName) {
                  clearSelectedPlaceHighlight();
                  setQueryBeforePlacePick(null);
                }
                setInput(value);
                setOpen(true);
              }}
              onFocus={() => {
                setFocused(true);
                setOpen(true);
              }}
              onBlur={() => {
                setFocused(false);
              }}
              onKeyDown={(e) => {
                handleSearchListKeyDown(e);
                if (e.key === "Escape") {
                  e.preventDefault();
                  clearSearch();
                }
              }}
              placeholder="Search, actions…"
              title={`Search (${SEARCH_SHORTCUT_LABEL})`}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Search maps, pins, actions, and pages"
              aria-expanded={open}
              {...searchListInputProps}
            />
            {busy ? (
              <SearchSpinner>
                <Loader2 aria-hidden />
              </SearchSpinner>
            ) : showToolbarClearButton ? (
              <SearchToolbarActions>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Clear search"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSearch();
                  }}
                >
                  <X aria-hidden />
                </Button>
              </SearchToolbarActions>
            ) : showToolbarShortcutHint ? (
              <SearchToolbarShortcutHint keys={SEARCH_SHORTCUT_KEYS} />
            ) : null}
          </SearchToolbarField>
        </SearchToolbarAnchor>
        <SearchPopoverContent>
          <SearchPopoverTitle>
            Search maps, actions, and pages
          </SearchPopoverTitle>
          <div>{selectedPlace ? activePlacePanel : searchResults}</div>
        </SearchPopoverContent>
      </Popover>
    </>
  );
}
