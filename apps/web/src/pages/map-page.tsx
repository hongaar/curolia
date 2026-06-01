import { MapViewInitialLoader } from "@/components/layout/map-view-initial-loader";
import { MapControlsToolbar } from "@/components/map/map-controls-toolbar";
import { PinMap, type PinMapHandle } from "@/components/map/pin-map";
import { PinMapMarkerPopover } from "@/components/map/pin-map-marker-popover";
import { AddPinFab } from "@/components/pins/add-pin-fab";
import { EmojiPicker } from "@/components/pins/emoji-picker";
import { PinFormDialog } from "@/components/pins/pin-form-dialog";
import { PinMapQuickAddDialog } from "@/components/pins/pin-map-quick-add-dialog";
import { PresetColorPicker } from "@/components/pins/preset-color-picker";
import { useMapSlugRouteSync } from "@/hooks/use-map-slug-route-sync";
import { useMaxSm } from "@/hooks/use-max-sm";
import {
  readStoredMapCamera,
  writeStoredMapCamera,
} from "@/lib/map-camera-storage";
import {
  applyAddPinToSearchParams,
  applyFilterTagsToSearchParams,
  applyMapCameraToSearchParams,
  applySelectedPinToSearchParams,
  bboxToSyncKey,
  cameraToSyncKey,
  normalizeCameraForUrl,
  parseAddPinFromSearchParams,
  parseMapBboxFromSearchParams,
  parseMapCameraFromSearchParams,
  parseSelectedPinTokenFromSearchParams,
  resolveFilterTagIdsFromSearchParams,
  resolvePinIdFromMapToken,
  stripMapBboxFromSearchParams,
  type MapCamera,
} from "@/lib/map-view-params";
import { reversePhotonPlaceDetails } from "@/lib/photon-geocode";
import type { PinWithTags } from "@/lib/pin-with-tags";
import { filterPinsByTags } from "@/lib/pin-with-tags";
import { DEFAULT_PIN_TAG_COLOR } from "@/lib/preset-pin-tag-colors";
import { supabase } from "@/lib/supabase";
import { useMap } from "@/providers/map-provider";
import { useNavigationShell } from "@/providers/navigation-shell-provider";
import { useMountTagSidebarRegistration } from "@/providers/tag-sidebar-provider";
import type { Pin, Tag } from "@/types/database";
import { Button } from "@curolia/ui/button";
import { Dialog, DialogFooter, DialogHeader } from "@curolia/ui/dialog";
import { Input } from "@curolia/ui/input";
import { Label } from "@curolia/ui/label";
import {
  MapControlsBottomRight,
  MapControlsLayer,
  MapControlsTopRight,
  MapHost,
  MapLayer,
  MapOverlayDismiss,
  MapPageRoot,
  MapPlacementHint,
  MapVignette,
} from "@curolia/ui/map";
import {
  PanelDialogContent,
  PanelDialogField,
  PanelDialogFormStack,
  PanelDialogTitle,
} from "@curolia/ui/panel-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export function MapPage() {
  const qc = useQueryClient();
  const { sidebarOpen, setSidebarOpen } = useNavigationShell();
  const isMobile = useMaxSm();
  const { mapSlug } = useParams<{ mapSlug: string }>();
  useMapSlugRouteSync(mapSlug);
  const mapRef = useRef<PinMapHandle>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const bboxFromUrl = useMemo(
    () => parseMapBboxFromSearchParams(searchParams),
    [searchParams],
  );
  const cameraFromUrl = useMemo(
    () => parseMapCameraFromSearchParams(searchParams),
    [searchParams],
  );
  const addPinFromUrl = useMemo(
    () => parseAddPinFromSearchParams(searchParams),
    [searchParams],
  );
  const { activeMapId, activeMap, loading: mapLoading } = useMap();
  const prevMapIdRef = useRef<string | null>(null);
  const [mapFitGeneration, setMapFitGeneration] = useState(0);
  const [mapFitResolvedGeneration, setMapFitResolvedGeneration] = useState(0);

  useLayoutEffect(() => {
    const prev = prevMapIdRef.current;
    if (prev !== null && activeMapId !== null && prev !== activeMapId) {
      setMapFitGeneration((g) => g + 1);
    }
    prevMapIdRef.current = activeMapId;
  }, [activeMapId]);

  const cameraIdleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [placementActive, setPlacementActive] = useState(false);
  const [quickAddPin, setQuickAddPin] = useState<Pin | null>(null);
  const [quickAddAnchorScreen, setQuickAddAnchorScreen] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [fullEditPin, setFullEditPin] = useState<Pin | null>(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagEditTarget, setTagEditTarget] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(DEFAULT_PIN_TAG_COLOR);
  const [newTagEmoji, setNewTagEmoji] = useState("📍");
  useEffect(() => {
    return () => clearTimeout(cameraIdleTimerRef.current);
  }, []);

  const onCameraIdle = useCallback(
    (c: MapCamera) => {
      clearTimeout(cameraIdleTimerRef.current);
      cameraIdleTimerRef.current = setTimeout(() => {
        const normalized = normalizeCameraForUrl(c);
        writeStoredMapCamera(activeMapId, normalized);
        setSearchParams(
          (prev) => {
            const prevNoBbox = stripMapBboxFromSearchParams(prev);
            const parsed = parseMapCameraFromSearchParams(prevNoBbox);
            if (
              parsed &&
              cameraToSyncKey(parsed) === cameraToSyncKey(normalized)
            )
              return prevNoBbox;
            return applyMapCameraToSearchParams(prevNoBbox, normalized);
          },
          { replace: true },
        );
      }, 280);
    },
    [activeMapId, setSearchParams],
  );

  const pinsQuery = useQuery({
    queryKey: ["pins", activeMapId],
    queryFn: async () => {
      if (!activeMapId) return [];
      const { data, error } = await supabase
        .from("pins")
        .select(
          `*,
          pin_tags ( tag_id, tags ( id, name, color, icon_emoji ) ),
          photos ( id, storage_path, sort_order )`,
        )
        .eq("map_id", activeMapId)
        .order("date", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as PinWithTags[];
    },
    enabled: Boolean(activeMapId) && !mapLoading,
  });

  const tagsQuery = useQuery({
    queryKey: ["tags", activeMapId],
    queryFn: async () => {
      if (!activeMapId) return [];
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("map_id", activeMapId)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(activeMapId) && !mapLoading,
  });

  const tags = useMemo(() => tagsQuery.data ?? [], [tagsQuery.data]);
  const filterTagIds = useMemo(
    () => resolveFilterTagIdsFromSearchParams(searchParams, tags),
    [searchParams, tags],
  );
  const setFilterTagIds = useCallback(
    (action: SetStateAction<Set<string>>) => {
      setSearchParams(
        (prev) => {
          const current = resolveFilterTagIdsFromSearchParams(prev, tags);
          const next = typeof action === "function" ? action(current) : action;
          return applyFilterTagsToSearchParams(prev, next, tags);
        },
        { replace: true },
      );
    },
    [tags, setSearchParams],
  );

  useMountTagSidebarRegistration({
    tags,
    filterTagIds,
    setFilterTagIds,
    onNewTag: () => {
      setTagEditTarget(null);
      setNewTagName("");
      setNewTagColor(DEFAULT_PIN_TAG_COLOR);
      setNewTagEmoji("📍");
      setTagDialogOpen(true);
    },
    onEditTag: (tag) => {
      setTagEditTarget(tag);
      setNewTagName(tag.name);
      setNewTagColor(tag.color);
      setNewTagEmoji(tag.icon_emoji || "📍");
      setTagDialogOpen(true);
    },
  });

  const pins = useMemo(() => pinsQuery.data ?? [], [pinsQuery.data]);

  const pinsReadyForMapFit =
    Boolean(activeMapId) && !mapLoading && !pinsQuery.isPending;
  const visiblePinsForFit = useMemo(
    () => filterPinsByTags(pins, filterTagIds),
    [pins, filterTagIds],
  );

  const mapFitPending = mapFitGeneration > mapFitResolvedGeneration;
  const mapFitCanResolve =
    Boolean(cameraFromUrl) ||
    (pinsReadyForMapFit && visiblePinsForFit.length === 0);
  const awaitingMapFit = mapFitPending && !mapFitCanResolve;

  useEffect(() => {
    if (!mapFitPending || !mapFitCanResolve) return;
    queueMicrotask(() => {
      setMapFitResolvedGeneration(mapFitGeneration);
    });
  }, [mapFitPending, mapFitCanResolve, mapFitGeneration]);

  const resolvedInitialCamera = useMemo((): MapCamera | null => {
    if (awaitingMapFit) return null;
    if (cameraFromUrl) return cameraFromUrl;
    if (bboxFromUrl) {
      return normalizeCameraForUrl({
        lat: (bboxFromUrl.south + bboxFromUrl.north) / 2,
        lng: (bboxFromUrl.west + bboxFromUrl.east) / 2,
        zoom: 10,
      });
    }
    return readStoredMapCamera(activeMapId);
  }, [awaitingMapFit, cameraFromUrl, bboxFromUrl, activeMapId]);
  const cameraSyncKey = useMemo(() => {
    if (awaitingMapFit) return "";
    if (bboxFromUrl) return `url:bbox:${bboxToSyncKey(bboxFromUrl)}`;
    if (cameraFromUrl) return `url:${cameraToSyncKey(cameraFromUrl)}`;
    if (resolvedInitialCamera)
      return `init:${cameraToSyncKey(resolvedInitialCamera)}`;
    return "";
  }, [awaitingMapFit, bboxFromUrl, cameraFromUrl, resolvedInitialCamera]);

  useEffect(() => {
    if (!awaitingMapFit) return;
    if (!pinsReadyForMapFit) return;
    if (visiblePinsForFit.length === 0) return;
    mapRef.current?.fitVisiblePins();
  }, [awaitingMapFit, pinsReadyForMapFit, visiblePinsForFit.length]);

  const sidebarPinToken = useMemo(
    () => parseSelectedPinTokenFromSearchParams(searchParams),
    [searchParams],
  );
  const sidebarPinId = useMemo(
    () => resolvePinIdFromMapToken(sidebarPinToken, pins),
    [sidebarPinToken, pins],
  );

  const onSelectPin = useCallback(
    (id: string) => {
      setQuickAddPin(null);
      setQuickAddAnchorScreen(null);
      const row = pins.find((x) => x.id === id);
      const token = row?.slug ?? id;
      setSearchParams((prev) => applySelectedPinToSearchParams(prev, token), {
        replace: true,
      });
    },
    [setSearchParams, pins],
  );

  const onClosePinMapPopover = useCallback(() => {
    setSearchParams((prev) => applySelectedPinToSearchParams(prev, null), {
      replace: true,
    });
  }, [setSearchParams]);

  const onPlacementClick = useCallback(
    async (lng: number, lat: number) => {
      if (!activeMapId) return;
      setSearchParams((prev) => applySelectedPinToSearchParams(prev, null), {
        replace: true,
      });

      try {
        const { fullLabel, shortTitle } = await reversePhotonPlaceDetails(
          lat,
          lng,
        );
        const { data: row, error } = await supabase
          .from("pins")
          .insert({
            map_id: activeMapId,
            title: shortTitle || null,
            location_label: fullLabel?.trim() || null,
            lat,
            lng,
          })
          .select("*")
          .single();
        if (error) throw error;
        await qc.invalidateQueries({ queryKey: ["pins", activeMapId] });

        const p = mapRef.current?.lngLatToScreen(lng, lat);
        setQuickAddAnchorScreen(p ?? null);
        setQuickAddPin(row as Pin);
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Could not create pin here.",
        );
      }
    },
    [activeMapId, qc, setSearchParams],
  );

  /** Stable marker lng/lat for pin popover while detail query loads (avoids fixed→floating flash). */
  const pinPopoverListAnchor = useMemo(() => {
    if (!sidebarPinId) return null;
    const t = pins.find((x) => x.id === sidebarPinId);
    if (
      !t ||
      typeof t.lat !== "number" ||
      typeof t.lng !== "number" ||
      !Number.isFinite(t.lat) ||
      !Number.isFinite(t.lng)
    )
      return null;
    return { lat: t.lat, lng: t.lng };
  }, [sidebarPinId, pins]);

  useEffect(() => {
    if (!sidebarPinToken) return;
    // While the active map's pins are still loading, do not strip ?pin= — the token may
    // belong to the new map (e.g. global search) and is not in the previous list yet.
    if (pinsQuery.isPending) return;
    if (pins.length === 0) return;
    if (resolvePinIdFromMapToken(sidebarPinToken, pins)) return;
    setSearchParams((prev) => applySelectedPinToSearchParams(prev, null), {
      replace: true,
    });
  }, [sidebarPinToken, pins, pinsQuery.isPending, setSearchParams]);

  useEffect(() => {
    if (!quickAddPin) return;
    const { lat, lng } = quickAddPin;
    const map = mapRef.current;
    if (!map) return;
    const upd = () => {
      const p = map.lngLatToScreen(lng, lat);
      if (p) setQuickAddAnchorScreen(p);
    };
    upd();
    const raf = requestAnimationFrame(upd);
    const unsub = map.subscribeCamera(upd);
    window.addEventListener("resize", upd);
    return () => {
      cancelAnimationFrame(raf);
      unsub();
      window.removeEventListener("resize", upd);
    };
  }, [quickAddPin]);

  useEffect(() => {
    if (!addPinFromUrl) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- latch placement from one-shot ?add= URL deep link
    setPlacementActive(true);
    setSearchParams(
      (prev) =>
        applyAddPinToSearchParams(
          applySelectedPinToSearchParams(prev, null),
          false,
        ),
      { replace: true },
    );
  }, [addPinFromUrl, setSearchParams]);

  useEffect(() => {
    if (!placementActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPlacementActive(false);
        setSearchParams((prev) => applyAddPinToSearchParams(prev, false), {
          replace: true,
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [placementActive, setSearchParams]);

  useEffect(() => {
    if (!sidebarPinToken) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchParams((prev) => applySelectedPinToSearchParams(prev, null), {
          replace: true,
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarPinToken, setSearchParams]);

  async function saveTag() {
    if (!activeMapId || !newTagName.trim()) return;
    if (tagEditTarget) {
      const { error } = await supabase
        .from("tags")
        .update({
          name: newTagName.trim(),
          color: newTagColor,
          icon_emoji: newTagEmoji || "📍",
          updated_at: new Date().toISOString(),
        })
        .eq("id", tagEditTarget.id);
      if (!error) {
        setTagDialogOpen(false);
        setTagEditTarget(null);
        await qc.invalidateQueries({ queryKey: ["tags", activeMapId] });
        await qc.invalidateQueries({ queryKey: ["pins", activeMapId] });
      }
      return;
    }
    const { error } = await supabase.from("tags").insert({
      map_id: activeMapId,
      name: newTagName.trim(),
      color: newTagColor,
      icon_emoji: newTagEmoji || "📍",
    });
    if (!error) {
      setNewTagName("");
      setTagDialogOpen(false);
      await qc.invalidateQueries({ queryKey: ["tags", activeMapId] });
    }
  }

  function toggleAddPinPlacement() {
    setPlacementActive((prev) => {
      const next = !prev;
      setSearchParams(
        (p) => {
          let params = applyAddPinToSearchParams(p, false);
          if (next) {
            params = applySelectedPinToSearchParams(params, null);
          }
          return params;
        },
        { replace: true },
      );
      return next;
    });
  }

  if (mapLoading) {
    return <MapViewInitialLoader />;
  }

  if (!activeMapId) {
    return <MapViewInitialLoader label="No map available." busy={false} />;
  }

  return (
    <MapPageRoot>
      <MapLayer>
        <MapVignette />
        <MapHost>
          <PinMap
            ref={mapRef}
            pins={pins}
            selectedTagIds={filterTagIds}
            selectedPinId={sidebarPinId}
            previewPin={null}
            onSelectPin={onSelectPin}
            placementMode={placementActive}
            onPlacementClick={onPlacementClick}
            initialCamera={resolvedInitialCamera}
            initialBbox={bboxFromUrl}
            cameraSyncKey={cameraSyncKey}
            onCameraIdle={onCameraIdle}
            onMapBackgroundClick={
              sidebarPinId ? onClosePinMapPopover : undefined
            }
          />
        </MapHost>
        <MapControlsLayer>
          <MapControlsTopRight>
            <MapControlsToolbar mapRef={mapRef} />
          </MapControlsTopRight>
        </MapControlsLayer>
        <MapControlsLayer>
          <MapControlsBottomRight>
            <AddPinFab
              active={placementActive}
              onClick={toggleAddPinPlacement}
            />
          </MapControlsBottomRight>
        </MapControlsLayer>
        {isMobile ? (
          <MapOverlayDismiss
            open={sidebarOpen}
            onDismiss={() => setSidebarOpen(false)}
          />
        ) : null}
      </MapLayer>

      {placementActive ? (
        <MapPlacementHint>
          Tap the map to add a pin · Esc or Stop adding to cancel
        </MapPlacementHint>
      ) : null}

      {sidebarPinId ? (
        <PinMapMarkerPopover
          key={
            isMobile ? "pin-map-marker-popover-mobile" : `${sidebarPinId}-lg`
          }
          pinId={sidebarPinId}
          mapId={activeMapId}
          mapSlug={mapSlug?.trim() || activeMap?.slug?.trim() || null}
          mapRef={mapRef}
          listAnchorLngLat={pinPopoverListAnchor}
          onClose={() =>
            setSearchParams(
              (prev) => applySelectedPinToSearchParams(prev, null),
              {
                replace: true,
              },
            )
          }
        />
      ) : null}

      <PinMapQuickAddDialog
        open={Boolean(quickAddPin)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setQuickAddPin(null);
            setQuickAddAnchorScreen(null);
          }
        }}
        mapId={activeMapId}
        pin={quickAddPin}
        anchorScreen={quickAddPin ? quickAddAnchorScreen : null}
        onEdit={(t) => {
          setQuickAddPin(null);
          setQuickAddAnchorScreen(null);
          setFullEditPin(t);
        }}
      />
      <PinFormDialog
        open={Boolean(fullEditPin)}
        onOpenChange={(open) => {
          if (!open) setFullEditPin(null);
        }}
        mapId={activeMapId}
        pin={fullEditPin}
      />
      <Dialog
        open={tagDialogOpen}
        onOpenChange={(open) => {
          setTagDialogOpen(open);
          if (!open) setTagEditTarget(null);
        }}
      >
        <PanelDialogContent>
          <DialogHeader>
            <PanelDialogTitle>
              {tagEditTarget ? "Edit tag" : "New tag"}
            </PanelDialogTitle>
          </DialogHeader>
          <PanelDialogFormStack>
            <PanelDialogField>
              <Label htmlFor="tag-name">Name</Label>
              <Input
                id="tag-name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
              />
            </PanelDialogField>
            <PresetColorPicker
              id="tag-color"
              label="Color"
              value={newTagColor}
              onChange={setNewTagColor}
            />
            <EmojiPicker
              id="tag-emoji"
              label="Icon (emoji)"
              value={newTagEmoji}
              onChange={setNewTagEmoji}
            />
          </PanelDialogFormStack>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTagDialogOpen(false);
                setTagEditTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => void saveTag()}>
              {tagEditTarget ? "Save tag" : "Create tag"}
            </Button>
          </DialogFooter>
        </PanelDialogContent>
      </Dialog>
    </MapPageRoot>
  );
}
