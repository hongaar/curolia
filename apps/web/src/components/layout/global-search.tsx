import { useMapMemberRole } from "@/hooks/use-map-access";
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
import { mapRouteForMap } from "@/lib/map-route";
import {
  applyMapBboxToSearchParams,
  applyMapCameraToSearchParams,
  applySelectedPinToSearchParams,
  normalizeCameraForUrl,
  PIN_FOCUS_ZOOM,
} from "@/lib/map-view-params";
import {
  searchPinsInMaps,
  sortPinsByPreferredMap,
  type PinSearchRow,
} from "@/lib/pin-text-search";
import { useAuth } from "@/providers/auth-provider";
import { useMap } from "@/providers/map-provider";
import { useNavigationShell } from "@/providers/navigation-shell-provider";
import {
  pinLocationLabel,
  searchPlaces,
  type PlaceSearchResult,
} from "@curolia/services/geocoding";
import {
  GlobalSearchEmptyHint,
  GlobalSearchFooter,
  GlobalSearchHeader,
  GlobalSearchIcon,
  GlobalSearchInput,
  GlobalSearchLabel,
  GlobalSearchPopoverContent,
  GlobalSearchPopoverTitle,
  GlobalSearchPopoverTrigger,
  GlobalSearchResultBody,
  GlobalSearchResultIcon,
  GlobalSearchResultRow,
  GlobalSearchResults,
  GlobalSearchResultShortcut,
  GlobalSearchResultSubtitle,
  GlobalSearchResultTitle,
  GlobalSearchSectionLabel,
  GlobalSearchShortcutKeys,
  GlobalSearchSpinner,
  GlobalSearchStatusText,
  GlobalSearchToolbarAnchor,
  GlobalSearchToolbarField,
  GlobalSearchToolbarShortcutHint,
} from "@curolia/ui/global-search";
import { Popover } from "@curolia/ui/popover";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
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
  Search,
  Settings,
  Settings2,
  User,
} from "lucide-react";
import {
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

const COMMAND_ICONS: Record<string, ReactNode> = {
  "new-map": <MapPlus />,
  "map-settings": <Settings />,
  "edit-pin": <Pencil />,
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
  shortcutKeys?: string[];
  onPick: () => void;
};

function ResultRow({
  icon,
  title,
  subtitle,
  shortcutKeys,
  onPick,
}: ResultButtonProps) {
  return (
    <GlobalSearchResultRow onClick={onPick}>
      <GlobalSearchResultIcon>{icon}</GlobalSearchResultIcon>
      <GlobalSearchResultBody>
        <GlobalSearchResultTitle>{title}</GlobalSearchResultTitle>
        {subtitle ? (
          <GlobalSearchResultSubtitle>{subtitle}</GlobalSearchResultSubtitle>
        ) : null}
      </GlobalSearchResultBody>
      {shortcutKeys ? <GlobalSearchResultShortcut keys={shortcutKeys} /> : null}
    </GlobalSearchResultRow>
  );
}

type GlobalSearchProps = {
  toolbarEmbed?: boolean;
};

export function GlobalSearch({ toolbarEmbed = false }: GlobalSearchProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const homeMatch = useMatch({ path: "/", end: true });
  const nestedMapMatch = useMatch("/:profileSlug/:mapSlug/map");
  const isMapRoute = Boolean(homeMatch || nestedMapMatch);
  const { maps, activeMapId, activeMap, publicView } = useMap();
  const { signOut } = useAuth();
  const { openNewMapDialog, openAboutDialog } = useNavigationShell();

  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
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

  const commandContext = useMemo(
    () => ({
      navigate,
      activeMap,
      selectedPin,
      canEditSelectedPin,
      openNewMapDialog,
      openAboutDialog,
      signOut,
    }),
    [
      navigate,
      activeMap,
      selectedPin,
      canEditSelectedPin,
      openNewMapDialog,
      openAboutDialog,
      signOut,
    ],
  );

  const closeSearch = useCallback(() => {
    setOpen(false);
    setFocused(false);
    setInput("");
    setDebounced("");
    inputRef.current?.blur();
  }, []);

  const runCommand = useCallback(
    (command: GlobalSearchCommandDef) => {
      runGlobalSearchCommand(command.id, commandContext);
      closeSearch();
    },
    [commandContext, closeSearch],
  );

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(input.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [input]);

  useEffect(() => {
    if (!open || toolbarEmbed) return;
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open, toolbarEmbed]);

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
          closeSearch();
          return;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commandContext, closeSearch]);

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
    enabled: open && isMapRoute && debounced.length >= 2,
    staleTime: 60_000,
  });

  const pinsSorted = useMemo(() => {
    const rows = pinsQuery.data ?? [];
    return sortPinsByPreferredMap(rows, activeMapId);
  }, [pinsQuery.data, activeMapId]);

  function onPickMap(j: MapWithOwnerSlug) {
    if (!j.slug.trim()) return;
    navigate(mapSwitchHref(j, location.pathname, location.search));
    closeSearch();
  }

  function onPickPin(t: PinSearchRow) {
    if (isMapRoute) {
      const map = mapById.get(t.map_id);
      if (!map?.owner_profile_slug || !map.slug?.trim()) {
        closeSearch();
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
        closeSearch();
        return;
      }
      navigate(pinDetailHref(mapRouteForMap(map), t.slug));
    }
    closeSearch();
  }

  function onPickPlace(p: PlaceSearchResult) {
    const map = maps.find((j) => j.id === activeMapId) ?? maps[0] ?? null;
    if (!map?.owner_profile_slug || !map.slug?.trim()) {
      closeSearch();
      return;
    }
    const route = mapRouteForMap(map);
    let params = new URLSearchParams();
    if (p.bbox) {
      params = applyMapBboxToSearchParams(params, p.bbox);
    }
    const center = p.bbox
      ? {
          lat: (p.bbox.south + p.bbox.north) / 2,
          lng: (p.bbox.west + p.bbox.east) / 2,
          zoom: 11,
        }
      : { lat: p.lat, lng: p.lng, zoom: 12 };
    params = applyMapCameraToSearchParams(
      params,
      normalizeCameraForUrl(center),
    );
    navigate(mapHrefWithSearch(route, `?${params.toString()}`));
    closeSearch();
  }

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

  const showPlaces = isMapRoute && debounced.length >= 2;
  const showPins = debounced.length >= 2;
  const showMapSearch = debounced.length >= 1;
  const busy =
    (showPins && pinsQuery.isFetching) ||
    (showPlaces && placesQuery.isFetching);
  const showToolbarShortcutHint = toolbarEmbed && input.length === 0 && !busy;

  const searchResults = (
    <>
      <GlobalSearchResults>
        {debounced.length === 0 ? (
          <GlobalSearchEmptyHint>
            Jump to actions and pages, or search maps by name. Type two or more
            characters to find pins
            {isMapRoute ? " and map places" : ""}.
          </GlobalSearchEmptyHint>
        ) : null}

        {actionMatches.length > 0 ? (
          <>
            <GlobalSearchSectionLabel>Actions</GlobalSearchSectionLabel>
            {actionMatches.map((command) => (
              <ResultRow
                key={command.id}
                icon={COMMAND_ICONS[command.id] ?? <Search />}
                title={command.title}
                subtitle={command.subtitle}
                shortcutKeys={
                  command.shortcut
                    ? formatShortcutKeys(command.shortcut)
                    : undefined
                }
                onPick={() => runCommand(command)}
              />
            ))}
          </>
        ) : null}

        {pageMatches.length > 0 ? (
          <>
            <GlobalSearchSectionLabel>Pages</GlobalSearchSectionLabel>
            {pageMatches.map((command) => (
              <ResultRow
                key={command.id}
                icon={COMMAND_ICONS[command.id] ?? <FileText />}
                title={command.title}
                subtitle={command.subtitle}
                onPick={() => runCommand(command)}
              />
            ))}
          </>
        ) : null}

        {showMapSearch && mapMatches.length > 0 ? (
          <>
            <GlobalSearchSectionLabel>Maps</GlobalSearchSectionLabel>
            {mapMatches.map((j) => (
              <ResultRow
                key={j.id}
                icon={<Notebook />}
                title={j.name}
                subtitle={j.is_public ? "Public" : undefined}
                onPick={() => onPickMap(j)}
              />
            ))}
          </>
        ) : null}

        {showMapSearch &&
        mapMatches.length === 0 &&
        debounced.length < 2 &&
        actionMatches.length === 0 &&
        pageMatches.length === 0 ? (
          <GlobalSearchStatusText>
            No maps match. Add another letter to search pins
            {isMapRoute ? " and places" : ""}.
          </GlobalSearchStatusText>
        ) : null}

        {showPins ? (
          <>
            <GlobalSearchSectionLabel>Pins</GlobalSearchSectionLabel>
            {pinsQuery.isError ? (
              <GlobalSearchStatusText>
                Could not load pins.
              </GlobalSearchStatusText>
            ) : pinsQuery.isFetching && pinsSorted.length === 0 ? (
              <GlobalSearchStatusText>Searching…</GlobalSearchStatusText>
            ) : pinsSorted.length === 0 ? (
              <GlobalSearchStatusText>No matching pins.</GlobalSearchStatusText>
            ) : (
              pinsSorted.map((t) => (
                <ResultRow
                  key={t.id}
                  icon={<MapPin />}
                  title={pinPrimaryLabel(t)}
                  subtitle={mapTitle(t, mapById)}
                  onPick={() => onPickPin(t)}
                />
              ))
            )}
          </>
        ) : null}

        {showPlaces ? (
          <>
            <GlobalSearchSectionLabel>Places</GlobalSearchSectionLabel>
            {placesQuery.isError ? (
              <GlobalSearchStatusText>
                Could not load places.
              </GlobalSearchStatusText>
            ) : placesQuery.isFetching &&
              (placesQuery.data?.length ?? 0) === 0 ? (
              <GlobalSearchStatusText>Searching…</GlobalSearchStatusText>
            ) : (placesQuery.data?.length ?? 0) === 0 ? (
              <GlobalSearchStatusText>
                No matching places.
              </GlobalSearchStatusText>
            ) : (
              (placesQuery.data ?? []).map((p) => {
                const primary = p.primaryName.trim();
                const full = p.fullLabel.trim();
                const subtitle = full && full !== primary ? full : undefined;
                return (
                  <ResultRow
                    key={p.id}
                    icon={<MapIcon />}
                    title={primary || full || "Place"}
                    subtitle={subtitle}
                    onPick={() => onPickPlace(p)}
                  />
                );
              })
            )}
          </>
        ) : null}
      </GlobalSearchResults>

      {!toolbarEmbed ? (
        <GlobalSearchFooter>
          <GlobalSearchShortcutKeys
            keys={SEARCH_SHORTCUT_KEYS}
            variant="footer"
          />{" "}
          to open · Pin results prefer the active map
        </GlobalSearchFooter>
      ) : null}
    </>
  );

  return (
    <Popover
      open={open}
      modal={false}
      onOpenChange={(next) => {
        if (
          !next &&
          toolbarEmbed &&
          document.activeElement === inputRef.current
        ) {
          // Suppress spurious close: Base UI fires onOpenChange(false) when the
          // user clicks the anchor (outside the popup DOM). Since the input is
          // still focused this is not a genuine outside-click dismiss.
          return;
        }
        if (!next) {
          closeSearch();
          return;
        }
        setOpen(true);
      }}
    >
      {toolbarEmbed ? (
        <GlobalSearchToolbarAnchor
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) {
              inputRef.current?.focus();
            }
          }}
        >
          <GlobalSearchToolbarField focused={focused}>
            <GlobalSearchIcon>
              <Search aria-hidden />
            </GlobalSearchIcon>
            <GlobalSearchInput
              ref={inputRef}
              variant="toolbar"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
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
                if (e.key === "Escape") {
                  e.preventDefault();
                  closeSearch();
                }
              }}
              placeholder="Search, actions…"
              title={`Search (${SEARCH_SHORTCUT_LABEL})`}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Search maps, pins, actions, and pages"
              aria-expanded={open}
              aria-controls={open ? "global-search-results" : undefined}
            />
            {busy ? (
              <GlobalSearchSpinner>
                <Loader2 aria-hidden />
              </GlobalSearchSpinner>
            ) : showToolbarShortcutHint ? (
              <GlobalSearchToolbarShortcutHint keys={SEARCH_SHORTCUT_KEYS} />
            ) : null}
          </GlobalSearchToolbarField>
        </GlobalSearchToolbarAnchor>
      ) : (
        <GlobalSearchPopoverTrigger title={`Search (${SEARCH_SHORTCUT_LABEL})`}>
          <GlobalSearchIcon>
            <Search />
          </GlobalSearchIcon>
          <GlobalSearchLabel toolbarEmbed={false}>Search…</GlobalSearchLabel>
        </GlobalSearchPopoverTrigger>
      )}
      <GlobalSearchPopoverContent toolbarEmbed={toolbarEmbed}>
        <GlobalSearchPopoverTitle>
          Search maps, actions, and pages
        </GlobalSearchPopoverTitle>
        {!toolbarEmbed ? (
          <GlobalSearchHeader>
            <GlobalSearchIcon>
              <Search aria-hidden />
            </GlobalSearchIcon>
            <GlobalSearchInput
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Maps, actions, pins…"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {busy ? (
              <GlobalSearchSpinner>
                <Loader2 aria-hidden />
              </GlobalSearchSpinner>
            ) : null}
          </GlobalSearchHeader>
        ) : null}
        <div id="global-search-results">{searchResults}</div>
      </GlobalSearchPopoverContent>
    </Popover>
  );
}
