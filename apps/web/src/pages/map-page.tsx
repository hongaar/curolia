import { JournalViewInitialLoader } from "@/components/layout/journal-view-initial-loader";
import { MapControlsToolbar } from "@/components/map/map-controls-toolbar";
import { TraceMap, type TraceMapHandle } from "@/components/map/trace-map";
import { TraceMapMarkerPopover } from "@/components/map/trace-map-marker-popover";
import { AddTraceFab } from "@/components/traces/add-trace-fab";
import { EmojiPicker } from "@/components/traces/emoji-picker";
import { PresetColorPicker } from "@/components/traces/preset-color-picker";
import { TraceFormDialog } from "@/components/traces/trace-form-dialog";
import { TraceMapQuickAddDialog } from "@/components/traces/trace-map-quick-add-dialog";
import { useJournalSlugRouteSync } from "@/hooks/use-journal-slug-route-sync";
import { useMaxSm } from "@/hooks/use-max-sm";
import {
  readStoredMapCamera,
  writeStoredMapCamera,
} from "@/lib/map-camera-storage";
import {
  applyAddTraceToSearchParams,
  applyFilterTagsToSearchParams,
  applyMapCameraToSearchParams,
  applySelectedTraceToSearchParams,
  bboxToSyncKey,
  cameraToSyncKey,
  normalizeCameraForUrl,
  parseAddTraceFromSearchParams,
  parseMapBboxFromSearchParams,
  parseMapCameraFromSearchParams,
  parseSelectedTraceTokenFromSearchParams,
  resolveFilterTagIdsFromSearchParams,
  resolveTraceIdFromMapToken,
  stripMapBboxFromSearchParams,
  type MapCamera,
} from "@/lib/map-view-params";
import { reversePhotonPlaceDetails } from "@/lib/photon-geocode";
import { DEFAULT_TRACE_TAG_COLOR } from "@/lib/preset-trace-tag-colors";
import { supabase } from "@/lib/supabase";
import type { TraceWithTags } from "@/lib/trace-with-tags";
import { filterTracesByTags } from "@/lib/trace-with-tags";
import { useJournal } from "@/providers/journal-provider";
import { useNavigationShell } from "@/providers/navigation-shell-provider";
import { useMountTagSidebarRegistration } from "@/providers/tag-sidebar-provider";
import type { Tag, Trace } from "@/types/database";
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
  const { journalSlug } = useParams<{ journalSlug: string }>();
  useJournalSlugRouteSync(journalSlug);
  const mapRef = useRef<TraceMapHandle>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const bboxFromUrl = useMemo(
    () => parseMapBboxFromSearchParams(searchParams),
    [searchParams],
  );
  const cameraFromUrl = useMemo(
    () => parseMapCameraFromSearchParams(searchParams),
    [searchParams],
  );
  const addTraceFromUrl = useMemo(
    () => parseAddTraceFromSearchParams(searchParams),
    [searchParams],
  );
  const {
    activeJournalId,
    activeJournal,
    loading: journalLoading,
  } = useJournal();
  const prevJournalIdRef = useRef<string | null>(null);
  const [journalFitGeneration, setJournalFitGeneration] = useState(0);
  const [journalFitResolvedGeneration, setJournalFitResolvedGeneration] =
    useState(0);

  useLayoutEffect(() => {
    const prev = prevJournalIdRef.current;
    if (prev !== null && activeJournalId !== null && prev !== activeJournalId) {
      setJournalFitGeneration((g) => g + 1);
    }
    prevJournalIdRef.current = activeJournalId;
  }, [activeJournalId]);

  const cameraIdleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [placementActive, setPlacementActive] = useState(false);
  const [quickAddTrace, setQuickAddTrace] = useState<Trace | null>(null);
  const [quickAddAnchorScreen, setQuickAddAnchorScreen] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [fullEditTrace, setFullEditTrace] = useState<Trace | null>(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagEditTarget, setTagEditTarget] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(DEFAULT_TRACE_TAG_COLOR);
  const [newTagEmoji, setNewTagEmoji] = useState("📍");
  useEffect(() => {
    return () => clearTimeout(cameraIdleTimerRef.current);
  }, []);

  const onCameraIdle = useCallback(
    (c: MapCamera) => {
      clearTimeout(cameraIdleTimerRef.current);
      cameraIdleTimerRef.current = setTimeout(() => {
        const normalized = normalizeCameraForUrl(c);
        writeStoredMapCamera(activeJournalId, normalized);
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
    [activeJournalId, setSearchParams],
  );

  const tracesQuery = useQuery({
    queryKey: ["traces", activeJournalId],
    queryFn: async () => {
      if (!activeJournalId) return [];
      const { data, error } = await supabase
        .from("traces")
        .select(
          `*,
          trace_tags ( tag_id, tags ( id, name, color, icon_emoji ) ),
          photos ( id, storage_path, sort_order )`,
        )
        .eq("journal_id", activeJournalId)
        .order("date", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as TraceWithTags[];
    },
    enabled: Boolean(activeJournalId) && !journalLoading,
  });

  const tagsQuery = useQuery({
    queryKey: ["tags", activeJournalId],
    queryFn: async () => {
      if (!activeJournalId) return [];
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("journal_id", activeJournalId)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(activeJournalId) && !journalLoading,
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
      setNewTagColor(DEFAULT_TRACE_TAG_COLOR);
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

  const traces = useMemo(() => tracesQuery.data ?? [], [tracesQuery.data]);

  const tracesReadyForJournalFit =
    Boolean(activeJournalId) && !journalLoading && !tracesQuery.isPending;
  const visibleTracesForFit = useMemo(
    () => filterTracesByTags(traces, filterTagIds),
    [traces, filterTagIds],
  );

  const journalFitPending = journalFitGeneration > journalFitResolvedGeneration;
  const journalFitCanResolve =
    Boolean(cameraFromUrl) ||
    (tracesReadyForJournalFit && visibleTracesForFit.length === 0);
  const awaitingJournalFit = journalFitPending && !journalFitCanResolve;

  useEffect(() => {
    if (!journalFitPending || !journalFitCanResolve) return;
    queueMicrotask(() => {
      setJournalFitResolvedGeneration(journalFitGeneration);
    });
  }, [journalFitPending, journalFitCanResolve, journalFitGeneration]);

  const resolvedInitialCamera = useMemo((): MapCamera | null => {
    if (awaitingJournalFit) return null;
    if (cameraFromUrl) return cameraFromUrl;
    if (bboxFromUrl) {
      return normalizeCameraForUrl({
        lat: (bboxFromUrl.south + bboxFromUrl.north) / 2,
        lng: (bboxFromUrl.west + bboxFromUrl.east) / 2,
        zoom: 10,
      });
    }
    return readStoredMapCamera(activeJournalId);
  }, [awaitingJournalFit, cameraFromUrl, bboxFromUrl, activeJournalId]);
  const cameraSyncKey = useMemo(() => {
    if (awaitingJournalFit) return "";
    if (bboxFromUrl) return `url:bbox:${bboxToSyncKey(bboxFromUrl)}`;
    if (cameraFromUrl) return `url:${cameraToSyncKey(cameraFromUrl)}`;
    if (resolvedInitialCamera)
      return `init:${cameraToSyncKey(resolvedInitialCamera)}`;
    return "";
  }, [awaitingJournalFit, bboxFromUrl, cameraFromUrl, resolvedInitialCamera]);

  useEffect(() => {
    if (!awaitingJournalFit) return;
    if (!tracesReadyForJournalFit) return;
    if (visibleTracesForFit.length === 0) return;
    mapRef.current?.fitVisibleTraces();
  }, [
    awaitingJournalFit,
    tracesReadyForJournalFit,
    visibleTracesForFit.length,
  ]);

  const sidebarTraceToken = useMemo(
    () => parseSelectedTraceTokenFromSearchParams(searchParams),
    [searchParams],
  );
  const sidebarTraceId = useMemo(
    () => resolveTraceIdFromMapToken(sidebarTraceToken, traces),
    [sidebarTraceToken, traces],
  );

  const onSelectTrace = useCallback(
    (id: string) => {
      setQuickAddTrace(null);
      setQuickAddAnchorScreen(null);
      const row = traces.find((x) => x.id === id);
      const token = row?.slug ?? id;
      setSearchParams((prev) => applySelectedTraceToSearchParams(prev, token), {
        replace: true,
      });
    },
    [setSearchParams, traces],
  );

  const onCloseTraceMapPopover = useCallback(() => {
    setSearchParams((prev) => applySelectedTraceToSearchParams(prev, null), {
      replace: true,
    });
  }, [setSearchParams]);

  const onPlacementClick = useCallback(
    async (lng: number, lat: number) => {
      if (!activeJournalId) return;
      setSearchParams((prev) => applySelectedTraceToSearchParams(prev, null), {
        replace: true,
      });

      try {
        const { fullLabel, shortTitle } = await reversePhotonPlaceDetails(
          lat,
          lng,
        );
        const { data: row, error } = await supabase
          .from("traces")
          .insert({
            journal_id: activeJournalId,
            title: shortTitle || null,
            location_label: fullLabel?.trim() || null,
            lat,
            lng,
          })
          .select("*")
          .single();
        if (error) throw error;
        await qc.invalidateQueries({ queryKey: ["traces", activeJournalId] });

        const p = mapRef.current?.lngLatToScreen(lng, lat);
        setQuickAddAnchorScreen(p ?? null);
        setQuickAddTrace(row as Trace);
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Could not create trace here.",
        );
      }
    },
    [activeJournalId, qc, setSearchParams],
  );

  /** Stable marker lng/lat for trace popover while detail query loads (avoids fixed→floating flash). */
  const tracePopoverListAnchor = useMemo(() => {
    if (!sidebarTraceId) return null;
    const t = traces.find((x) => x.id === sidebarTraceId);
    if (
      !t ||
      typeof t.lat !== "number" ||
      typeof t.lng !== "number" ||
      !Number.isFinite(t.lat) ||
      !Number.isFinite(t.lng)
    )
      return null;
    return { lat: t.lat, lng: t.lng };
  }, [sidebarTraceId, traces]);

  useEffect(() => {
    if (!sidebarTraceToken) return;
    // While the active journal's traces are still loading, do not strip ?trace= — the token may
    // belong to the new journal (e.g. global search) and is not in the previous list yet.
    if (tracesQuery.isPending) return;
    if (traces.length === 0) return;
    if (resolveTraceIdFromMapToken(sidebarTraceToken, traces)) return;
    setSearchParams((prev) => applySelectedTraceToSearchParams(prev, null), {
      replace: true,
    });
  }, [sidebarTraceToken, traces, tracesQuery.isPending, setSearchParams]);

  useEffect(() => {
    if (!quickAddTrace) return;
    const { lat, lng } = quickAddTrace;
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
  }, [quickAddTrace]);

  useEffect(() => {
    if (!addTraceFromUrl) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- latch placement from one-shot ?add= URL deep link
    setPlacementActive(true);
    setSearchParams(
      (prev) =>
        applyAddTraceToSearchParams(
          applySelectedTraceToSearchParams(prev, null),
          false,
        ),
      { replace: true },
    );
  }, [addTraceFromUrl, setSearchParams]);

  useEffect(() => {
    if (!placementActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPlacementActive(false);
        setSearchParams((prev) => applyAddTraceToSearchParams(prev, false), {
          replace: true,
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [placementActive, setSearchParams]);

  useEffect(() => {
    if (!sidebarTraceToken) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchParams(
          (prev) => applySelectedTraceToSearchParams(prev, null),
          { replace: true },
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarTraceToken, setSearchParams]);

  async function saveTag() {
    if (!activeJournalId || !newTagName.trim()) return;
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
        await qc.invalidateQueries({ queryKey: ["tags", activeJournalId] });
        await qc.invalidateQueries({ queryKey: ["traces", activeJournalId] });
      }
      return;
    }
    const { error } = await supabase.from("tags").insert({
      journal_id: activeJournalId,
      name: newTagName.trim(),
      color: newTagColor,
      icon_emoji: newTagEmoji || "📍",
    });
    if (!error) {
      setNewTagName("");
      setTagDialogOpen(false);
      await qc.invalidateQueries({ queryKey: ["tags", activeJournalId] });
    }
  }

  function toggleAddTracePlacement() {
    setPlacementActive((prev) => {
      const next = !prev;
      setSearchParams(
        (p) => {
          let params = applyAddTraceToSearchParams(p, false);
          if (next) {
            params = applySelectedTraceToSearchParams(params, null);
          }
          return params;
        },
        { replace: true },
      );
      return next;
    });
  }

  if (journalLoading) {
    return <JournalViewInitialLoader />;
  }

  if (!activeJournalId) {
    return (
      <JournalViewInitialLoader label="No journal available." busy={false} />
    );
  }

  return (
    <MapPageRoot>
      <MapLayer>
        <MapVignette />
        <MapHost>
          <TraceMap
            ref={mapRef}
            traces={traces}
            selectedTagIds={filterTagIds}
            selectedTraceId={sidebarTraceId}
            previewPin={null}
            onSelectTrace={onSelectTrace}
            placementMode={placementActive}
            onPlacementClick={onPlacementClick}
            initialCamera={resolvedInitialCamera}
            initialBbox={bboxFromUrl}
            cameraSyncKey={cameraSyncKey}
            onCameraIdle={onCameraIdle}
            onMapBackgroundClick={
              sidebarTraceId ? onCloseTraceMapPopover : undefined
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
            <AddTraceFab
              active={placementActive}
              onClick={toggleAddTracePlacement}
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
          Tap the map to add a trace · Esc or Stop adding to cancel
        </MapPlacementHint>
      ) : null}

      {sidebarTraceId ? (
        <TraceMapMarkerPopover
          key={
            isMobile
              ? "trace-map-marker-popover-mobile"
              : `${sidebarTraceId}-lg`
          }
          traceId={sidebarTraceId}
          journalId={activeJournalId}
          journalSlug={
            journalSlug?.trim() || activeJournal?.slug?.trim() || null
          }
          mapRef={mapRef}
          listAnchorLngLat={tracePopoverListAnchor}
          onClose={() =>
            setSearchParams(
              (prev) => applySelectedTraceToSearchParams(prev, null),
              {
                replace: true,
              },
            )
          }
        />
      ) : null}

      <TraceMapQuickAddDialog
        open={Boolean(quickAddTrace)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setQuickAddTrace(null);
            setQuickAddAnchorScreen(null);
          }
        }}
        journalId={activeJournalId}
        trace={quickAddTrace}
        anchorScreen={quickAddTrace ? quickAddAnchorScreen : null}
        onEdit={(t) => {
          setQuickAddTrace(null);
          setQuickAddAnchorScreen(null);
          setFullEditTrace(t);
        }}
      />
      <TraceFormDialog
        open={Boolean(fullEditTrace)}
        onOpenChange={(open) => {
          if (!open) setFullEditTrace(null);
        }}
        journalId={activeJournalId}
        trace={fullEditTrace}
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
