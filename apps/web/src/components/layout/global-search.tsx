import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Map as MapIcon,
  MapPin,
  Notebook,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { useLocation, useMatch, useNavigate } from "react-router-dom";
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
} from "@curolia/ui/curolia/global-search-ui";
import { Popover } from "@curolia/ui/popover";
import {
  applyMapBboxToSearchParams,
  applyMapCameraToSearchParams,
  applySelectedTraceToSearchParams,
  normalizeCameraForUrl,
  TRACE_FOCUS_ZOOM,
} from "@/lib/map-view-params";
import {
  journalSwitchHref,
  mapHrefWithSearch,
  traceDetailHref,
} from "@/lib/app-paths";
import { searchPhotonPlaces, type PhotonPlace } from "@/lib/photon-geocode";
import {
  searchTracesInJournals,
  sortTracesByPreferredJournal,
  type TraceSearchRow,
} from "@/lib/trace-text-search";
import { useJournal } from "@/providers/journal-provider";
import type { Journal } from "@/types/database";

const DEBOUNCE_MS = 320;

function journalTitle(
  trace: TraceSearchRow,
  journalById: Map<string, Journal>,
) {
  return journalById.get(trace.journal_id)?.name ?? "Journal";
}

function tracePrimaryLabel(t: TraceSearchRow): string {
  const title = t.title?.trim();
  if (title) return title;
  const place = t.location_label?.trim();
  if (place) return place;
  const desc = t.description?.trim();
  if (desc) return desc.length > 72 ? `${desc.slice(0, 72)}…` : desc;
  return "Untitled trace";
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
  const mapJournalMatch = useMatch("/map/:journalSlug");
  const isMapRoute = Boolean(homeMatch || mapJournalMatch);
  const { journals, activeJournalId, setActiveJournalId } = useJournal();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(input.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [input]);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const journalIds = useMemo(() => journals.map((j) => j.id), [journals]);
  const journalIdsKey = useMemo(
    () => [...journalIds].sort().join(","),
    [journalIds],
  );
  const journalById = useMemo(
    () => new Map(journals.map((j) => [j.id, j])),
    [journals],
  );

  const journalMatches = useMemo(() => {
    const q = debounced.toLowerCase();
    if (q.length < 1) return [];
    return journals
      .filter((j) => j.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const as = a.id === activeJournalId ? 0 : 1;
        const bs = b.id === activeJournalId ? 0 : 1;
        if (as !== bs) return as - bs;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 12);
  }, [debounced, journals, activeJournalId]);

  const tracesQuery = useQuery({
    queryKey: ["global-search-traces", debounced, journalIdsKey],
    queryFn: () => searchTracesInJournals(journalIds, debounced),
    enabled: open && debounced.length >= 2 && journalIds.length > 0,
  });

  const placesQuery = useQuery({
    queryKey: ["global-search-places", debounced],
    queryFn: () => searchPhotonPlaces(debounced),
    enabled: open && isMapRoute && debounced.length >= 2,
    staleTime: 60_000,
  });

  const tracesSorted = useMemo(() => {
    const rows = tracesQuery.data ?? [];
    return sortTracesByPreferredJournal(rows, activeJournalId);
  }, [tracesQuery.data, activeJournalId]);

  function onPickJournal(j: Journal) {
    if (!j.slug.trim()) return;
    navigate(journalSwitchHref(j, location.pathname, location.search));
    setOpen(false);
  }

  function onPickTrace(t: TraceSearchRow) {
    flushSync(() => {
      setActiveJournalId(t.journal_id);
    });
    if (isMapRoute) {
      const journal = journalById.get(t.journal_id);
      const slug = journal?.slug?.trim();
      if (!slug) {
        setOpen(false);
        return;
      }
      const withTrace = applySelectedTraceToSearchParams(
        new URLSearchParams(),
        t.slug,
      );
      const params = applyMapCameraToSearchParams(
        withTrace,
        normalizeCameraForUrl({
          lat: t.lat,
          lng: t.lng,
          zoom: TRACE_FOCUS_ZOOM,
        }),
      );
      navigate(mapHrefWithSearch(slug, `?${params.toString()}`));
    } else {
      const journal = journalById.get(t.journal_id);
      const js = journal?.slug?.trim();
      navigate(js ? traceDetailHref(js, t.slug) : "/");
    }
    setOpen(false);
  }

  function onPickPlace(p: PhotonPlace) {
    const journal =
      journals.find((j) => j.id === activeJournalId) ?? journals[0] ?? null;
    const slug = journal?.slug?.trim();
    if (!slug) {
      setOpen(false);
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
    setOpen(false);
  }

  const showPlaces = isMapRoute && debounced.length >= 2;
  const showTraces = debounced.length >= 2;
  const busy =
    (showTraces && tracesQuery.isFetching) ||
    (showPlaces && placesQuery.isFetching);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setInput("");
          setDebounced("");
        }
      }}
    >
      <GlobalSearchPopoverTrigger
        toolbarEmbed={toolbarEmbed}
        title="Search (Ctrl+K)"
      >
        <GlobalSearchIcon>
          <Search />
        </GlobalSearchIcon>
        <GlobalSearchLabel toolbarEmbed={toolbarEmbed}>
          Search…
        </GlobalSearchLabel>
      </GlobalSearchPopoverTrigger>
      <GlobalSearchPopoverContent>
        <GlobalSearchPopoverTitle>
          Search journals and traces
        </GlobalSearchPopoverTitle>
        <GlobalSearchHeader>
          <GlobalSearchIcon>
            <Search aria-hidden />
          </GlobalSearchIcon>
          <GlobalSearchInput
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Journals, traces…"
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

        <GlobalSearchResults>
          {debounced.length === 0 ? (
            <GlobalSearchEmptyHint>
              Search journals by name. Type two or more characters to find
              traces
              {isMapRoute ? " and map places" : ""}.
            </GlobalSearchEmptyHint>
          ) : null}

          {debounced.length >= 1 && journalMatches.length > 0 ? (
            <>
              <GlobalSearchSectionLabel>Journals</GlobalSearchSectionLabel>
              {journalMatches.map((j) => (
                <ResultRow
                  key={j.id}
                  icon={<Notebook />}
                  title={j.name}
                  subtitle={j.is_personal ? "Personal" : undefined}
                  onPick={() => onPickJournal(j)}
                />
              ))}
            </>
          ) : null}

          {debounced.length >= 1 &&
          journalMatches.length === 0 &&
          debounced.length < 2 ? (
            <GlobalSearchStatusText>
              No journals match. Add another letter to search traces
              {isMapRoute ? " and places" : ""}.
            </GlobalSearchStatusText>
          ) : null}

          {showTraces ? (
            <>
              <GlobalSearchSectionLabel>Traces</GlobalSearchSectionLabel>
              {tracesQuery.isError ? (
                <GlobalSearchStatusText>
                  Could not load traces.
                </GlobalSearchStatusText>
              ) : tracesQuery.isFetching && tracesSorted.length === 0 ? (
                <GlobalSearchStatusText>Searching…</GlobalSearchStatusText>
              ) : tracesSorted.length === 0 ? (
                <GlobalSearchStatusText>
                  No matching traces.
                </GlobalSearchStatusText>
              ) : (
                tracesSorted.map((t) => (
                  <ResultRow
                    key={t.id}
                    icon={<MapPin />}
                    title={tracePrimaryLabel(t)}
                    subtitle={journalTitle(t, journalById)}
                    onPick={() => onPickTrace(t)}
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

        <GlobalSearchFooter>
          <GlobalSearchKbd>Ctrl</GlobalSearchKbd>{" "}
          <GlobalSearchKbd>K</GlobalSearchKbd> to open · Trace results prefer
          the active journal
        </GlobalSearchFooter>
      </GlobalSearchPopoverContent>
    </Popover>
  );
}
