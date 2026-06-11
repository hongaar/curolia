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
  PIN_FOCUS_ZOOM,
} from "@/lib/map-view-params";
import { openPinEditor } from "@/lib/open-pin-editor";
import { placeHighlightFitBbox } from "@/lib/pin-map-place-highlight";
import {
  searchPinsInMaps,
  sortPinsByPreferredMap,
  type PinSearchRow,
} from "@/lib/pin-text-search";
import { useAuth } from "@/providers/auth-provider";
import { useGlobalSearchPlace } from "@/providers/global-search-place-provider";
import { useMap } from "@/providers/map-provider";
import { useNavigationShell } from "@/providers/navigation-shell-provider";
import {
  pinLocationLabel,
  searchPlaces,
  type PlaceSearchResult,
} from "@curolia/services/geocoding";
import { Button } from "@curolia/ui/button";
import { Popover } from "@curolia/ui/popover";
import {
  SearchEmptyHint,
  SearchIcon as SearchFieldIcon,
  SearchInput,
  SearchPopoverContent,
  SearchPopoverTitle,
  SearchResultBody,
  SearchResultCategory,
  SearchResultIcon,
  SearchResultRow,
  SearchResults,
  SearchResultShortcut,
  SearchResultSubtitle,
  SearchResultTitle,
  SearchResultTitleRow,
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
  MapPin,
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
  icon: ReactNode;
  title: string;
  subtitle?: string;
  categoryLabel?: string;
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
  shortcutKeys,
  onPick,
  id,
  active = false,
  selected = false,
  onMouseMove,
}: ResultButtonProps) {
  return (
    <SearchResultRow
      id={id}
      active={active}
      selected={selected}
      onMouseMove={onMouseMove}
      onClick={onPick}
    >
      <SearchResultIcon>{icon}</SearchResultIcon>
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
      {shortcutKeys ? <SearchResultShortcut keys={shortcutKeys} /> : null}
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
  const [pinDialogAction, setPinDialogAction] =
    useState<PinDialogAction | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      onOpenDialog: () => setPinDialogAction("edit"),
    });
  }, [isMobile, navigate, selectedPin]);

  const moveSelectedPin = useCallback(() => {
    if (!canMoveSelectedPin) return;
    setPinDialogAction("move");
  }, [canMoveSelectedPin]);

  const deleteSelectedPin = useCallback(() => {
    if (!selectedPin || !canEditSelectedPin) return;
    setPinDialogAction("delete");
  }, [canEditSelectedPin, selectedPin]);

  const selectedPinId = selectedPin?.pin.id ?? null;

  useEffect(() => {
    setPinDialogAction((current) => {
      if (current === "move" || current === "delete") return null;
      return current;
    });
  }, [selectedPinId]);

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

  const clearSearch = useCallback(() => {
    dismissPopover();
    setInput("");
    setDebounced("");
    clearSelectedPlace();
  }, [clearSelectedPlace, dismissPopover]);

  useEffect(() => {
    if (open) return;
    inputRef.current?.blur();
  }, [open]);

  const runCommand = useCallback(
    (command: GlobalSearchCommandDef) => {
      runGlobalSearchCommand(command.id, commandContext);
      clearSearch();
    },
    [clearSearch, commandContext],
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
    enabled: open && debounced.length >= 2 && mapIds.length > 0,
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
      clearSearch();
    },
    [clearSearch, location.pathname, location.search, navigate],
  );

  const onPickPin = useCallback(
    (t: PinSearchRow) => {
      if (isMapRoute) {
        const map = mapById.get(t.map_id);
        if (!map?.owner_profile_slug || !map.slug?.trim()) {
          clearSearch();
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
          clearSearch();
          return;
        }
        navigate(pinDetailHref(mapRouteForMap(map), t.slug));
      }
      clearSearch();
    },
    [clearSearch, isMapRoute, mapById, navigate],
  );

  const onPickPlace = useCallback(
    (p: PlaceSearchResult) => {
      const map = maps.find((j) => j.id === activeMapId) ?? maps[0] ?? null;
      if (!map?.owner_profile_slug || !map.slug?.trim()) {
        clearSearch();
        return;
      }
      const route = mapRouteForMap(map);
      let params = new URLSearchParams();
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
      dismissPopover();
      navigate(mapHrefWithSearch(route, `?${params.toString()}`));
    },
    [activeMapId, clearSearch, dismissPopover, maps, navigate, selectPlace],
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
  const showToolbarPlaceActions = selectedPlace != null;

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
          onSelect: () => onPickPlace(place),
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
    onPickPlace,
  ]);

  const {
    handleInputKeyDown: handleSearchListKeyDown,
    getItemProps,
    inputProps: searchListInputProps,
  } = useSearchListKeyboard({
    listboxId: SEARCH_LISTBOX_ID,
    items: selectableItems,
    enabled: open,
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
            Jump to actions and pages, or search maps by name. Type two or more
            characters to find pins
            {isMapRoute ? " and map places" : ""}.
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
                return (
                  <ResultRow
                    key={t.id}
                    icon={<MapPin />}
                    title={pinPrimaryLabel(t)}
                    subtitle={mapTitle(t, mapById)}
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
                    icon={<MapIcon />}
                    title={primary || full || "Place"}
                    subtitle={subtitle}
                    categoryLabel={p.categoryLabel}
                    onPick={() => onPickPlace(p)}
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

  return (
    <>
      {pinDialogAction && selectedPin ? (
        <Suspense fallback={null}>
          <PinFormDialog
            key={`${selectedPin.pin.id}:${pinDialogAction}`}
            open
            onOpenChange={(next) => {
              if (!next) setPinDialogAction(null);
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
              dismissPopover();
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
                  clearSelectedPlace();
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
            ) : showToolbarPlaceActions ? (
              <SearchToolbarActions>
                {canEditMap && isMapRoute ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.stopPropagation();
                      requestAddPinFromSelectedPlace();
                      dismissPopover();
                    }}
                  >
                    Add pin
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Clear place search"
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
          <div>{searchResults}</div>
        </SearchPopoverContent>
      </Popover>
    </>
  );
}
