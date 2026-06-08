import type { MapSettingsPanelProps } from "@curolia/plugin-contract";
import { mapPluginConfigRecord } from "@curolia/plugin-contract";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  isPolarstepsImportActive,
  mergePolarstepsConfig,
  parsePolarstepsMapConfig,
  POLARSTEPS_PLUGIN_ID,
  type PolarstepsImportJob,
  type PolarstepsTripPreview,
} from "./config";
import {
  polarstepsImport,
  polarstepsPreviewTrip,
  polarstepsSyncStatus,
  type PolarstepsSyncStatusResponse,
} from "./polarsteps-edge";
import { tripOptionId } from "./share-url";
import {
  formatImportSummary,
  isImportInProgress,
  isStaleActiveImportJob,
  type WizardImportSessionResult,
} from "./wizard-helpers";

export type { WizardImportSessionResult };

export function usePolarstepsMapImport({
  supabase,
  mapId,
  jp,
  pluginGloballyEnabled,
  readOnly = false,
  wizardOpen = false,
}: MapSettingsPanelProps & {
  wizardOpen?: boolean;
}) {
  const qc = useQueryClient();
  const parsed = parsePolarstepsMapConfig(mapPluginConfigRecord(jp));

  const [selectedTripIds, setSelectedTripIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [wizardImportResult, setWizardImportResult] =
    useState<WizardImportSessionResult | null>(null);

  const statusQuery = useQuery({
    queryKey: ["polarsteps_status", mapId],
    queryFn: () => polarstepsSyncStatus(supabase, mapId),
    enabled: Boolean(mapId) && pluginGloballyEnabled,
    staleTime: wizardOpen ? 0 : Infinity,
    refetchInterval: (query) => {
      const importActive = isPolarstepsImportActive(
        query.state.data?.importJob,
      );
      return importActive ? 2000 : false;
    },
  });

  const tripOptions = useMemo(
    () => statusQuery.data?.trips ?? [],
    [statusQuery.data?.trips],
  );

  const importedTripIds = useMemo(() => {
    const job = statusQuery.data?.importJob ?? parsed.importJob;
    const fromJob =
      job?.status === "completed"
        ? job.sources
            .map((s) => {
              try {
                const m = s.shareUrl.match(/\/(\d+)-/);
                return m?.[1];
              } catch {
                return undefined;
              }
            })
            .filter((id): id is string => Boolean(id))
        : undefined;
    const ids = new Set([
      ...(parsed.importedTripIds ?? []),
      ...(statusQuery.data?.importedTripIds ?? []),
      ...(fromJob ?? []),
    ]);
    return [...ids];
  }, [
    parsed.importedTripIds,
    parsed.importJob,
    statusQuery.data?.importJob,
    statusQuery.data?.importedTripIds,
  ]);

  const importedTripIdSet = useMemo(
    () => new Set(importedTripIds),
    [importedTripIds],
  );

  const importJob = statusQuery.data?.importJob ?? parsed.importJob;
  const lastSyncAt = statusQuery.data?.lastSyncAt ?? parsed.lastSyncAt;
  const importInProgress = isImportInProgress(importJob, lastSyncAt);
  const handledImportRef = useRef<string | null>(null);
  const repairedStaleImportRef = useRef(false);

  const saveConfig = useMutation({
    mutationFn: async (patch: {
      lastSyncAt?: string;
      lastSyncSummary?: PolarstepsImportJob["summary"];
      importJob?: PolarstepsImportJob;
      importedTripIds?: string[];
    }) => {
      const config = mergePolarstepsConfig(mapPluginConfigRecord(jp), patch);
      const { error } = await supabase.from("map_plugins").upsert(
        {
          map_id: mapId,
          plugin_type_id: POLARSTEPS_PLUGIN_ID,
          enabled: true,
          config,
          status: "connected",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "map_id,plugin_type_id" },
      );
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["map_plugins", mapId] });
    },
    onError: (e) => {
      toast.error(
        e instanceof Error ? e.message : "Could not update Polarsteps settings",
      );
    },
  });

  useEffect(() => {
    if (wizardOpen) {
      void statusQuery.refetch();
      return;
    }
    repairedStaleImportRef.current = false;
    setWizardImportResult(null);
    void statusQuery.refetch();
  }, [wizardOpen]);

  useEffect(() => {
    if (!wizardOpen || repairedStaleImportRef.current) return;
    if (!isStaleActiveImportJob(importJob, lastSyncAt) || !importJob) return;

    repairedStaleImportRef.current = true;
    const summary =
      parsed.lastSyncSummary ??
      statusQuery.data?.lastSyncSummary ??
      importJob.summary;
    void saveConfig
      .mutateAsync({
        importJob: {
          ...importJob,
          status: "completed",
          phase: "Import complete",
          finishedAt:
            lastSyncAt ?? importJob.finishedAt ?? new Date().toISOString(),
          processed: importJob.total || importJob.processed,
          total: importJob.total || importJob.processed,
          summary,
        },
      })
      .then(() =>
        qc.invalidateQueries({ queryKey: ["polarsteps_status", mapId] }),
      );
  }, [
    wizardOpen,
    importJob,
    lastSyncAt,
    parsed.lastSyncSummary,
    statusQuery.data?.lastSyncSummary,
    qc,
    mapId,
  ]);

  useEffect(() => {
    if (!wizardOpen || tripOptions.length === 0) return;
    if (selectedTripIds.size > 0) return;
    const notImported = tripOptions.filter(
      (t) => !importedTripIdSet.has(t.tripId),
    );
    const pick = notImported.length > 0 ? notImported : tripOptions;
    setSelectedTripIds(new Set(pick.map((t) => tripOptionId(t.tripId))));
  }, [wizardOpen, tripOptions, importedTripIdSet, selectedTripIds.size]);

  useEffect(() => {
    if (!importJob || importJob.status !== "completed") return;
    if (handledImportRef.current === importJob.id) return;
    if (!wizardOpen) return;

    handledImportRef.current = importJob.id;
    const summary = importJob.summary ?? parsed.lastSyncSummary;
    if (summary) {
      setWizardImportResult({
        summary,
        finishedAt: importJob.finishedAt ?? new Date().toISOString(),
      });
    }
    void qc.invalidateQueries({ queryKey: ["pins", mapId] });
    void qc.invalidateQueries({ queryKey: ["tags", mapId] });
    void qc.invalidateQueries({ queryKey: ["polarsteps_status", mapId] });
  }, [importJob, wizardOpen, parsed.lastSyncSummary, qc, mapId]);

  useEffect(() => {
    if (!importJob || importJob.status !== "failed") return;
    if (handledImportRef.current === importJob.id) return;
    if (!wizardOpen) return;

    handledImportRef.current = importJob.id;
    toast.error(importJob.error ?? "Polarsteps import failed.");
  }, [importJob, wizardOpen]);

  const previewMut = useMutation({
    mutationFn: (shareUrl: string) => polarstepsPreviewTrip(supabase, shareUrl),
    onSuccess: async (data) => {
      const tripId = tripOptionId(data.trip.tripId);
      setSelectedTripIds((prev) => new Set([...prev, tripId]));
      qc.setQueryData(
        ["polarsteps_status", mapId],
        (old: PolarstepsSyncStatusResponse | undefined) => {
          if (!old) return old;
          const existing = old.trips ?? [];
          const trips = existing.some((t) => t.tripId === data.trip.tripId)
            ? existing
            : [data.trip, ...existing];
          return { ...old, trips };
        },
      );
      await qc.invalidateQueries({ queryKey: ["polarsteps_status", mapId] });
      toast.success("Trip added");
    },
    onError: (e) => {
      toast.error(
        e instanceof Error ? e.message : "Could not load Polarsteps trip",
      );
    },
  });

  const importMut = useMutation({
    mutationFn: async (trips: PolarstepsTripPreview[]) => {
      const sources = trips.map((t) => ({
        type: "share_url" as const,
        shareUrl: t.shareUrl,
      }));
      return polarstepsImport(supabase, mapId, sources);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["polarsteps_status", mapId] });
    },
    onError: (e) => {
      toast.error(
        e instanceof Error ? e.message : "Could not start Polarsteps import",
      );
    },
  });

  function toggleTripId(tripId: string, checked: boolean) {
    if (importedTripIdSet.has(tripId)) return;
    setSelectedTripIds((current) => {
      const next = new Set(current);
      if (checked) next.add(tripId);
      else next.delete(tripId);
      for (const importedId of importedTripIds) {
        next.add(importedId);
      }
      return next;
    });
  }

  const selectAllTrips = () => {
    setSelectedTripIds(new Set(tripOptions.map((t) => tripOptionId(t.tripId))));
  };

  const deselectAllTrips = () => setSelectedTripIds(new Set());

  const selectedTrips = tripOptions.filter((t) =>
    selectedTripIds.has(tripOptionId(t.tripId)),
  );

  const importButtonLabel =
    importedTripIds.length > 0 ? "Import more trips" : "Import from Polarsteps";

  const clearWizardImportResult = () => setWizardImportResult(null);

  return {
    readOnly,
    pluginGloballyEnabled,
    parsed,
    statusQuery,
    tripOptions,
    selectedTripIds,
    importedTripIds,
    importedTripIdSet,
    toggleTripId,
    selectAllTrips,
    deselectAllTrips,
    selectedTrips,
    busy: previewMut.isPending || importMut.isPending || saveConfig.isPending,
    importInProgress,
    importJob,
    lastSyncAt,
    importMut,
    previewMut,
    wizardImportResult,
    clearWizardImportResult,
    importButtonLabel,
    formatImportSummary,
  };
}

export type PolarstepsMapImportState = ReturnType<
  typeof usePolarstepsMapImport
>;
