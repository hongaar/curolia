import {
  mapHrefWithSearch,
  mapSwitchHref,
  pinDetailHref,
} from "@/lib/app-paths";
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
import { useMap } from "@/providers/map-provider";
import type { CuroliaMap } from "@/types/database";
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
  GlobalSearchKbd,
  GlobalSearchLabel,
  GlobalSearchPopoverContent,
  GlobalSearchPopoverTitle,
  GlobalSearchPopoverTrigger,
  GlobalSearchResultBody,
  GlobalSearchResultIcon,
  GlobalSearchResultRow,
  GlobalSearchResults,
  GlobalSearchResultSubtitle,
  GlobalSearchResultTitle,
  GlobalSearchSectionLabel,
  GlobalSearchSpinner,
  GlobalSearchStatusText,
  GlobalSearchToolbarAnchor,
  GlobalSearchToolbarField,
} from "@curolia/ui/global-search";
import { Popover } from "@curolia/ui/popover";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Map as MapIcon,
  MapPin,
  Notebook,
  Search,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { useLocation, useMatch, useNavigate } from "react-router-dom";

const DEBOUNCE_MS = 320;

function mapTitle(pin: PinSearchRow, mapById: Map<string, CuroliaMap>) {
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
  onPick: () => void;
};

function ResultRow({ icon, title, subtitle, onPick }: ResultButtonProps) {
  return (
    <GlobalSearchResultRow onClick={onPick}>
      <GlobalSearchResultIcon>{icon}</GlobalSearchResultIcon>
      <GlobalSearchResultBody>
        <GlobalSearchResultTitle>{title}</GlobalSearchResultTitle>
        {subtitle ? (
          <GlobalSearchResultSubtitle>{subtitle}</GlobalSearchResultSubtitle>
        ) : null}
      </GlobalSearchResultBody>
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
  const mapMapMatch = useMatch("/map/:mapSlug");
  const isMapRoute = Boolean(homeMatch || mapMapMatch);
  const { maps, activeMapId, setActiveMapId } = useMap();

  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setFocused(false);
    setInput("");
    setDebounced("");
    inputRef.current?.blur();
  }, []);

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
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

  function onPickMap(j: CuroliaMap) {
    if (!j.slug.trim()) return;
    navigate(mapSwitchHref(j, location.pathname, location.search));
    closeSearch();
  }

  function onPickPin(t: PinSearchRow) {
    flushSync(() => {
      setActiveMapId(t.map_id);
    });
    if (isMapRoute) {
      const map = mapById.get(t.map_id);
      const slug = map?.slug?.trim();
      if (!slug) {
        closeSearch();
        return;
      }
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
      navigate(mapHrefWithSearch(slug, `?${params.toString()}`));
    } else {
      const map = mapById.get(t.map_id);
      const js = map?.slug?.trim();
      navigate(js ? pinDetailHref(js, t.slug) : "/");
    }
    closeSearch();
  }

  function onPickPlace(p: PlaceSearchResult) {
    const map = maps.find((j) => j.id === activeMapId) ?? maps[0] ?? null;
    const slug = map?.slug?.trim();
    if (!slug) {
      closeSearch();
      return;
    }
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
    navigate(mapHrefWithSearch(slug, `?${params.toString()}`));
    closeSearch();
  }

  const showPlaces = isMapRoute && debounced.length >= 2;
  const showPins = debounced.length >= 2;
  const busy =
    (showPins && pinsQuery.isFetching) ||
    (showPlaces && placesQuery.isFetching);

  const searchResults = (
    <>
      <GlobalSearchResults>
        {debounced.length === 0 ? (
          <GlobalSearchEmptyHint>
            Search maps by name. Type two or more characters to find pins
            {isMapRoute ? " and map places" : ""}.
          </GlobalSearchEmptyHint>
        ) : null}

        {debounced.length >= 1 && mapMatches.length > 0 ? (
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

        {debounced.length >= 1 &&
        mapMatches.length === 0 &&
        debounced.length < 2 ? (
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
          <GlobalSearchKbd>Ctrl</GlobalSearchKbd>{" "}
          <GlobalSearchKbd>K</GlobalSearchKbd> to open · Pin results prefer the
          active map
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
              placeholder="Search…"
              title="Search (Ctrl+K)"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Search maps and pins"
              aria-expanded={open}
              aria-controls={open ? "global-search-results" : undefined}
            />
            {busy ? (
              <GlobalSearchSpinner>
                <Loader2 aria-hidden />
              </GlobalSearchSpinner>
            ) : null}
          </GlobalSearchToolbarField>
        </GlobalSearchToolbarAnchor>
      ) : (
        <GlobalSearchPopoverTrigger title="Search (Ctrl+K)">
          <GlobalSearchIcon>
            <Search />
          </GlobalSearchIcon>
          <GlobalSearchLabel toolbarEmbed={false}>Search…</GlobalSearchLabel>
        </GlobalSearchPopoverTrigger>
      )}
      <GlobalSearchPopoverContent toolbarEmbed={toolbarEmbed}>
        <GlobalSearchPopoverTitle>
          Search maps and pins
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
              placeholder="Maps, pins…"
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
