import type { PinMapHandle } from "@/components/map/pin-map";
import { useMaxSm } from "@/hooks/use-max-sm";
import { createPinAtLocation } from "@/lib/create-pin-at-location";
import {
  ADD_PIN_PANEL_WIDTH_PX,
  mapFabPanelMiddleware,
  mapPaddingAvoidRect,
} from "@/lib/map-anchor-floating-ui";
import {
  findExactPlaceMatch,
  isExactPlaceMatch,
} from "@/lib/place-search-match";
import type { Pin } from "@/types/database";
import {
  searchPlaces,
  type PlaceSearchResult,
} from "@curolia/services/geocoding";
import { Button } from "@curolia/ui/button";
import {
  Dialog,
  DialogBody,
  DialogCardTitle,
  DialogContent,
  DialogFooter,
  DialogFooterEnd,
  DialogFooterStart,
  DialogHeader,
  DialogTitle,
} from "@curolia/ui/dialog";
import {
  GlobalSearchEmptyHint,
  GlobalSearchResultBody,
  GlobalSearchResultIcon,
  GlobalSearchResultRow,
  GlobalSearchResultSubtitle,
  GlobalSearchResultTitle,
  GlobalSearchResults,
  GlobalSearchSectionLabel,
  GlobalSearchStatusText,
  useSearchListKeyboard,
  type SearchListKeyboardItem,
} from "@curolia/ui/global-search";
import { Input } from "@curolia/ui/input";
import {
  Field,
  FieldControl,
  FieldError,
  FieldLabel,
  PinFormFloatingHost,
  PinFormPanelFieldGroup,
} from "@curolia/ui/pin-form";
import { autoUpdate, computePosition } from "@floating-ui/dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Map as MapIcon } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { toast } from "sonner";

const DEBOUNCE_MS = 320;
const MIN_SEARCH_CHARS = 2;
const ADD_PIN_PLACES_LISTBOX_ID = "add-pin-places-listbox";

const addPinPanelStyle = {
  width: `${ADD_PIN_PANEL_WIDTH_PX}px`,
  minWidth: `${ADD_PIN_PANEL_WIDTH_PX}px`,
  maxWidth: `${ADD_PIN_PANEL_WIDTH_PX}px`,
} as const;

const addPinFormStyle = {
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  height: "100%",
} as const;

const addPinBodyLayoutStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-4)",
  flex: "1 1 auto",
  minHeight: 0,
} as const;

/** Fixed height so the location field stays anchored while results load. */
const addPinResultsPaneStyle = {
  flex: "0 0 auto",
  height: "16rem",
  minHeight: "16rem",
  overflowY: "auto",
  overflowX: "hidden",
} as const;

type AddPinDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fabRef: RefObject<HTMLButtonElement | null>;
  mapId: string;
  mapRef: RefObject<PinMapHandle | null>;
  onPreviewChange: (preview: { lat: number; lng: number } | null) => void;
  onCreated: (pin: Pin) => void;
  onOnboardingComplete?: () => void;
};

function placeRowSubtitle(p: PlaceSearchResult): string | undefined {
  const primary = p.primaryName.trim();
  const full = p.fullLabel.trim();
  return full && full !== primary ? full : undefined;
}

export function AddPinDialog({
  open,
  onOpenChange,
  fabRef,
  mapId,
  mapRef,
  onPreviewChange,
  onCreated,
  onOnboardingComplete,
}: AddPinDialogProps) {
  const isNarrow = useMaxSm();
  const qc = useQueryClient();
  const floatingRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  /** When set, auto-select must not override a manual row pick for this query. */
  const manualPickQueryRef = useRef<string | null>(null);

  const [locationInput, setLocationInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useFloatingPanel = open && !isNarrow;

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(
      () => setDebouncedSearch(locationInput.trim()),
      DEBOUNCE_MS,
    );
    return () => window.clearTimeout(t);
  }, [open, locationInput]);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      manualPickQueryRef.current = null;
      setLocationInput("");
      setDebouncedSearch("");
      setSelectedPlace(null);
      setError(null);
      onPreviewChange(null);
    });
  }, [open, onPreviewChange]);

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => locationRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open]);

  const placesQuery = useQuery({
    queryKey: ["add-pin-places", debouncedSearch],
    queryFn: () => searchPlaces(debouncedSearch),
    enabled: open && debouncedSearch.length >= MIN_SEARCH_CHARS,
    staleTime: 60_000,
  });

  const dialogRect = useCallback((): DOMRect | null => {
    return floatingRef.current?.getBoundingClientRect() ?? null;
  }, []);

  const flyToPlace = useCallback(
    (place: PlaceSearchResult) => {
      const map = mapRef.current;
      if (!map) return;
      map.flyToLocation(place.lng, place.lat, {
        bbox: place.bbox,
        padding: mapPaddingAvoidRect(dialogRect()),
      });
    },
    [dialogRect, mapRef],
  );

  const pickPlace = useCallback(
    (place: PlaceSearchResult, source: "auto" | "manual" = "auto") => {
      if (source === "manual") {
        manualPickQueryRef.current = debouncedSearch;
      }
      setSelectedPlace(place);
      setError(null);
      onPreviewChange({ lat: place.lat, lng: place.lng });
      flyToPlace(place);
    },
    [debouncedSearch, flyToPlace, onPreviewChange],
  );

  useLayoutEffect(() => {
    if (!useFloatingPanel) return;
    const anchor = fabRef.current;
    const floating = floatingRef.current;
    if (!anchor || !floating) return;

    const run = () =>
      computePosition(anchor, floating, {
        placement: "left-end",
        strategy: "fixed",
        middleware: mapFabPanelMiddleware(),
      }).then((data) => {
        const el = floatingRef.current;
        if (!el) return;
        Object.assign(el.style, {
          position: "fixed",
          left: `${data.x}px`,
          top: `${data.y}px`,
          right: "auto",
          bottom: "auto",
          width: "",
          minWidth: "",
          maxWidth: "",
        });
      });

    void run();
    return autoUpdate(anchor, floating, run, {
      animationFrame: true,
      layoutShift: true,
    });
  }, [useFloatingPanel, fabRef]);

  useEffect(() => {
    if (!open || debouncedSearch.length < MIN_SEARCH_CHARS) return;
    if (locationInput.trim() !== debouncedSearch) return;
    if (manualPickQueryRef.current === debouncedSearch) return;
    if (
      selectedPlace != null &&
      isExactPlaceMatch(debouncedSearch, selectedPlace)
    ) {
      return;
    }
    if (placesQuery.fetchStatus !== "idle") return;
    const data = placesQuery.data;
    if (!data?.length) return;
    const exact = findExactPlaceMatch(debouncedSearch, data);
    if (exact) queueMicrotask(() => pickPlace(exact, "auto"));
  }, [
    open,
    debouncedSearch,
    locationInput,
    placesQuery.data,
    placesQuery.dataUpdatedAt,
    placesQuery.fetchStatus,
    selectedPlace,
    pickPlace,
  ]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const showPlaces = debouncedSearch.length >= MIN_SEARCH_CHARS;
  const places = placesQuery.data ?? [];
  const placesBusy = showPlaces && placesQuery.isFetching;

  const selectablePlaces = useMemo((): SearchListKeyboardItem[] => {
    if (!showPlaces || placesQuery.isError || places.length === 0) return [];
    return places.map((place) => ({
      id: place.id,
      onSelect: () => pickPlace(place, "manual"),
    }));
  }, [showPlaces, placesQuery.isError, places, pickPlace]);

  const {
    handleInputKeyDown: handleSearchListKeyDown,
    getItemProps,
    inputProps: searchListInputProps,
  } = useSearchListKeyboard({
    listboxId: ADD_PIN_PLACES_LISTBOX_ID,
    items: selectablePlaces,
    enabled: open,
  });

  const placeIndexById = useMemo(() => {
    const map = new Map<string, number>();
    selectablePlaces.forEach((item, index) => map.set(item.id, index));
    return map;
  }, [selectablePlaces]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlace || busy) return;

    setBusy(true);
    setError(null);
    try {
      const { lat, lng } = selectedPlace;
      const zoom = mapRef.current?.getCurrentCamera()?.zoom ?? 12;
      const row = await createPinAtLocation({ mapId, lat, lng, zoom });
      toast.success("Pin created");
      await qc.invalidateQueries({ queryKey: ["pins", mapId] });
      onPreviewChange(null);
      onOpenChange(false);
      onCreated(row);
      onOnboardingComplete?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create this pin.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  const close = () => onOpenChange(false);

  const form = (
    <form style={addPinFormStyle} onSubmit={(e) => void onSubmit(e)}>
      <DialogHeader showCloseButton onClose={close}>
        {isNarrow ? (
          <DialogTitle>Add pin</DialogTitle>
        ) : (
          <DialogCardTitle>Add pin</DialogCardTitle>
        )}
      </DialogHeader>
      <DialogBody>
        <div style={addPinBodyLayoutStyle}>
          <div style={addPinResultsPaneStyle}>
            <GlobalSearchResults embedded id={ADD_PIN_PLACES_LISTBOX_ID}>
              {debouncedSearch.length === 0 ? (
                <GlobalSearchEmptyHint>
                  Search for a place to add to your map.
                </GlobalSearchEmptyHint>
              ) : null}

              {showPlaces ? (
                <>
                  <GlobalSearchSectionLabel>Places</GlobalSearchSectionLabel>
                  {placesQuery.isError ? (
                    <GlobalSearchStatusText>
                      Could not load places.
                    </GlobalSearchStatusText>
                  ) : placesBusy && places.length === 0 ? (
                    <GlobalSearchStatusText>Searching…</GlobalSearchStatusText>
                  ) : places.length === 0 ? (
                    <GlobalSearchStatusText>
                      No matching places.
                    </GlobalSearchStatusText>
                  ) : (
                    places.map((p) => {
                      const primary = p.primaryName.trim();
                      const full = p.fullLabel.trim();
                      const selected = selectedPlace?.id === p.id;
                      const index = placeIndexById.get(p.id);
                      const rowProps = index == null ? {} : getItemProps(index);
                      return (
                        <GlobalSearchResultRow
                          key={p.id}
                          selected={selected}
                          onClick={() => pickPlace(p, "manual")}
                          {...rowProps}
                        >
                          <GlobalSearchResultIcon>
                            <MapIcon aria-hidden />
                          </GlobalSearchResultIcon>
                          <GlobalSearchResultBody>
                            <GlobalSearchResultTitle>
                              {primary || full || "Place"}
                            </GlobalSearchResultTitle>
                            {placeRowSubtitle(p) ? (
                              <GlobalSearchResultSubtitle>
                                {placeRowSubtitle(p)}
                              </GlobalSearchResultSubtitle>
                            ) : null}
                          </GlobalSearchResultBody>
                        </GlobalSearchResultRow>
                      );
                    })
                  )}
                </>
              ) : debouncedSearch.length > 0 &&
                debouncedSearch.length < MIN_SEARCH_CHARS ? (
                <GlobalSearchStatusText>
                  Add another letter to search places.
                </GlobalSearchStatusText>
              ) : null}
            </GlobalSearchResults>
          </div>

          <PinFormPanelFieldGroup>
            <Field>
              <FieldLabel htmlFor="add-pin-location">Location</FieldLabel>
              <FieldControl>
                <Input
                  ref={locationRef}
                  id="add-pin-location"
                  value={locationInput}
                  onChange={(e) => {
                    manualPickQueryRef.current = null;
                    setLocationInput(e.target.value);
                    setSelectedPlace(null);
                    onPreviewChange(null);
                  }}
                  onKeyDown={handleSearchListKeyDown}
                  autoComplete="off"
                  placeholder="Search for a place…"
                  aria-label="Search for a place"
                  aria-expanded={selectablePlaces.length > 0}
                  {...searchListInputProps}
                />
              </FieldControl>
            </Field>
          </PinFormPanelFieldGroup>

          {error ? <FieldError>{error}</FieldError> : null}
        </div>
      </DialogBody>
      <DialogFooter between>
        <DialogFooterStart>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={close}
          >
            Cancel
          </Button>
        </DialogFooterStart>
        <DialogFooterEnd>
          <Button type="submit" disabled={busy || !selectedPlace}>
            {busy ? "Adding…" : "Add pin"}
          </Button>
        </DialogFooterEnd>
      </DialogFooter>
    </form>
  );

  if (isNarrow) {
    return (
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent>{form}</DialogContent>
      </Dialog>
    );
  }

  return (
    <PinFormFloatingHost hostRef={floatingRef}>
      <DialogContent modal={false} style={addPinPanelStyle}>
        {form}
      </DialogContent>
    </PinFormFloatingHost>
  );
}
