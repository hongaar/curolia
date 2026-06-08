import type { MapSettingsPanelProps } from "@curolia/plugin-contract";
import { mapPluginConfigRecord } from "@curolia/plugin-contract";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  GOOGLE_MAPS_SAVED_LISTS_PLUGIN_ID,
  isGoogleMapsImportActive,
  isGoogleMapsListDiscoveryActive,
  isOneTimeDataPortabilityAccess,
  mergeGoogleMapsSavedListsConfig,
  parseGoogleMapsSavedListsMapConfig,
  type GoogleMapsImportJob,
} from "./config";
import {
  googleMapsSavedListsImport,
  googleMapsSavedListsListSources,
  googleMapsSavedListsStartDownload,
  googleMapsSavedListsSyncStatus,
} from "./google-maps-saved-lists-edge";
import {
  buildGoogleMapsImportListOptions,
  listOptionIdFromSource,
  resolveImportedListOptionIds,
} from "./import-list-options";
import {
  formatImportSummary,
  isImportInProgress,
  isStaleActiveImportJob,
  resolveImportButtonLabel,
  resolveInitialWizardStep,
  type WizardImportSessionResult,
} from "./wizard-helpers";

export type { WizardImportSessionResult };

const DISCOVERY_FAILURE_TOAST_MS = 5 * 60 * 1000;

export function useGoogleMapsMapImport({
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
  const parsed = parseGoogleMapsSavedListsMapConfig(mapPluginConfigRecord(jp));

  const [selectedListIds, setSelectedListIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [wizardImportResult, setWizardImportResult] =
    useState<WizardImportSessionResult | null>(null);

  const statusQuery = useQuery({
    queryKey: ["google_maps_saved_lists_status", mapId],
    queryFn: () => googleMapsSavedListsSyncStatus(supabase, mapId),
    enabled: Boolean(mapId) && pluginGloballyEnabled,
    staleTime: wizardOpen ? 0 : Infinity,
    refetchInterval: (query) => {
      const data = query.state.data;
      const importActive = isGoogleMapsImportActive(data?.importJob);
      const downloadActive = isGoogleMapsListDiscoveryActive(
        data?.listDiscoveryJob,
      );
      return importActive || downloadActive ? 2000 : false;
    },
  });

  const linked = statusQuery.data?.linked === true;
  const listDiscoveryJob = statusQuery.data?.listDiscoveryJob;
  const listDiscoveryActive = isGoogleMapsListDiscoveryActive(listDiscoveryJob);
  const listDiscoveryFailed = listDiscoveryJob?.status === "failed";
  const hasExportCache = statusQuery.data?.hasExportCache === true;

  const sourcesQuery = useQuery({
    queryKey: ["google_maps_saved_lists_sources"],
    queryFn: () => googleMapsSavedListsListSources(supabase),
    enabled: Boolean(mapId) && pluginGloballyEnabled && wizardOpen && linked,
    staleTime: 30_000,
    refetchInterval: (query) => {
      if (!wizardOpen) return false;
      const job =
        query.state.data?.listDiscoveryJob ??
        statusQuery.data?.listDiscoveryJob;
      return isGoogleMapsListDiscoveryActive(job) ? 2000 : false;
    },
  });

  const importListOptions = useMemo(
    () => buildGoogleMapsImportListOptions(sourcesQuery.data),
    [sourcesQuery.data],
  );

  const importedListIds = useMemo(() => {
    const job = statusQuery.data?.importJob ?? parsed.importJob;
    return resolveImportedListOptionIds({
      configIds: parsed.importedListIds,
      statusIds: statusQuery.data?.importedListIds,
      completedJobSources:
        job?.status === "completed" ? job.sources : undefined,
      options: importListOptions,
    });
  }, [
    parsed.importedListIds,
    parsed.importJob,
    statusQuery.data?.importJob,
    statusQuery.data?.importedListIds,
    importListOptions,
  ]);

  const importedListIdSet = useMemo(
    () => new Set(importedListIds),
    [importedListIds],
  );

  const importJob = statusQuery.data?.importJob ?? parsed.importJob;
  const lastSyncAt = statusQuery.data?.lastSyncAt ?? parsed.lastSyncAt;
  const importInProgress = isImportInProgress(importJob, lastSyncAt);
  const importActive = isGoogleMapsImportActive(importJob);
  const handledImportRef = useRef<string | null>(null);
  const handledDiscoveryRef = useRef<string | null>(null);
  const wasImportInProgressRef = useRef(false);
  const wasDiscoveryActiveRef = useRef(false);
  const importSessionActiveRef = useRef(false);
  const discoverySessionActiveRef = useRef(false);
  const repairedStaleImportRef = useRef(false);
  const selectionRestoredRef = useRef(false);

  const saveConfig = useMutation({
    mutationFn: async (patch: {
      lastSyncAt?: string;
      lastSyncSummary?: {
        added: number;
        tagged?: number;
        skipped: number;
        failed: number;
      };
      importJob?: GoogleMapsImportJob;
      importedListIds?: string[];
    }) => {
      const config = mergeGoogleMapsSavedListsConfig(
        mapPluginConfigRecord(jp),
        patch,
      );
      const { error } = await supabase.from("map_plugins").upsert(
        {
          map_id: mapId,
          plugin_type_id: GOOGLE_MAPS_SAVED_LISTS_PLUGIN_ID,
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
        e instanceof Error
          ? e.message
          : "Could not update Google Maps settings",
      );
    },
  });

  const accessType =
    statusQuery.data?.accessType ?? sourcesQuery.data?.accessType;
  const isOneTimeAccess = isOneTimeDataPortabilityAccess(accessType);

  useEffect(() => {
    if (wizardOpen) {
      void statusQuery.refetch();
      if (linked) void sourcesQuery.refetch();
      return;
    }
    repairedStaleImportRef.current = false;
    setWizardImportResult(null);
    void statusQuery.refetch();
  }, [wizardOpen, linked]);

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
        qc.invalidateQueries({
          queryKey: ["google_maps_saved_lists_status", mapId],
        }),
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
    if (listDiscoveryJob?.status !== "completed") return;
    void sourcesQuery.refetch();
    void statusQuery.refetch();
  }, [listDiscoveryJob?.status, listDiscoveryJob?.id]);

  useEffect(() => {
    if (!wizardOpen) {
      selectionRestoredRef.current = false;
      return;
    }
    if (selectionRestoredRef.current || importListOptions.length === 0) return;

    selectionRestoredRef.current = true;
    if (importedListIds.length === 0) return;

    const valid = new Set(importListOptions.map((option) => option.id));
    const restored = new Set(importedListIds.filter((id) => valid.has(id)));
    if (restored.size > 0) {
      setSelectedListIds(restored);
    }
  }, [wizardOpen, importListOptions, importedListIds]);

  useEffect(() => {
    if (importListOptions.length === 0) return;
    const valid = new Set(importListOptions.map((option) => option.id));
    setSelectedListIds((current) => {
      const next = new Set([...current].filter((id) => valid.has(id)));
      for (const id of importedListIds) {
        if (valid.has(id)) next.add(id);
      }
      if (
        next.size === current.size &&
        [...current].every((id) => next.has(id))
      ) {
        return current;
      }
      return next;
    });
  }, [importListOptions, importedListIds]);

  useEffect(() => {
    const job = statusQuery.data?.importJob;
    const inProgress = isImportInProgress(job, lastSyncAt);
    const justFinished =
      (wasImportInProgressRef.current || importSessionActiveRef.current) &&
      Boolean(job?.finishedAt) &&
      !inProgress;

    wasImportInProgressRef.current = inProgress;

    if (!justFinished || !job?.finishedAt) return;

    importSessionActiveRef.current = false;

    const key = `${job.id}:${job.status}`;
    if (handledImportRef.current === key) return;
    handledImportRef.current = key;

    if (job.status === "completed" && job.summary) {
      void qc.invalidateQueries({ queryKey: ["pins", mapId] });
      void qc.invalidateQueries({ queryKey: ["tags", mapId] });
      const importedListIdsNext = [
        ...new Set([
          ...importedListIds,
          ...job.sources.map(listOptionIdFromSource),
        ]),
      ];
      void saveConfig
        .mutateAsync({
          lastSyncAt: job.finishedAt,
          lastSyncSummary: job.summary,
          importJob: job,
          importedListIds: importedListIdsNext,
        })
        .then(() =>
          qc.invalidateQueries({
            queryKey: ["google_maps_saved_lists_status", mapId],
          }),
        );
      if (wizardOpen) {
        setWizardImportResult({ status: "completed", summary: job.summary });
      } else {
        toast.success(`Import complete: ${formatImportSummary(job.summary)}.`);
      }
      return;
    }

    if (job.status === "failed") {
      void saveConfig.mutateAsync({ importJob: job }).then(() =>
        qc.invalidateQueries({
          queryKey: ["google_maps_saved_lists_status", mapId],
        }),
      );
      if (wizardOpen) {
        setWizardImportResult({
          status: "failed",
          error: job.error ?? "Import failed",
        });
      } else {
        toast.error(job.error ?? "Import failed");
      }
    }
  }, [
    statusQuery.data?.importJob,
    lastSyncAt,
    parsed.importedListIds,
    importedListIds,
    qc,
    mapId,
    saveConfig,
    wizardOpen,
  ]);

  const selectedSources = useMemo(
    () =>
      importListOptions
        .filter(
          (option) =>
            selectedListIds.has(option.id) && !importedListIdSet.has(option.id),
        )
        .map((option) => option.source),
    [importListOptions, selectedListIds, importedListIdSet],
  );

  const startDownloadMut = useMutation({
    mutationFn: () => googleMapsSavedListsStartDownload(supabase),
    onMutate: () => {
      discoverySessionActiveRef.current = true;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: ["google_maps_saved_lists_status", mapId],
      });
      await qc.invalidateQueries({
        queryKey: ["google_maps_saved_lists_sources"],
      });
    },
    onError: (e) => {
      discoverySessionActiveRef.current = false;
      toast.error(
        e instanceof Error ? e.message : "Could not start Google download",
      );
    },
  });

  useEffect(() => {
    const job = statusQuery.data?.listDiscoveryJob;
    const active = isGoogleMapsListDiscoveryActive(job);
    const failed = job?.status === "failed";
    const justFailed =
      (wasDiscoveryActiveRef.current || discoverySessionActiveRef.current) &&
      failed &&
      Boolean(job?.finishedAt);

    wasDiscoveryActiveRef.current = active;
    if (failed) discoverySessionActiveRef.current = false;

    if (!failed || !job?.finishedAt) return;

    const key = `${job.id}:failed`;
    if (handledDiscoveryRef.current === key) return;

    const failedAt = new Date(job.finishedAt).getTime();
    const recentFailure =
      !Number.isNaN(failedAt) &&
      Date.now() - failedAt < DISCOVERY_FAILURE_TOAST_MS;

    if (!justFailed && !recentFailure) return;

    handledDiscoveryRef.current = key;
    toast.error(job.error ?? "Google Maps download failed");
  }, [statusQuery.data?.listDiscoveryJob]);

  const importMut = useMutation({
    mutationFn: async () => {
      if (selectedSources.length === 0) {
        throw new Error("Choose at least one list to import.");
      }
      return googleMapsSavedListsImport(supabase, mapId, selectedSources);
    },
    onMutate: () => {
      setWizardImportResult(null);
      importSessionActiveRef.current = true;
    },
    onSuccess: async (data) => {
      await qc.invalidateQueries({
        queryKey: ["google_maps_saved_lists_status", mapId],
      });
      await qc.invalidateQueries({ queryKey: ["map_plugins", mapId] });
      if (data.importJob?.status === "failed" && !wizardOpen) {
        toast.error(data.importJob.error ?? "Import failed");
      }
    },
    onError: (e) => {
      const message = e instanceof Error ? e.message : "Import failed";
      if (wizardOpen) {
        setWizardImportResult({ status: "failed", error: message });
      } else {
        toast.error(message);
      }
    },
  });

  const busy =
    saveConfig.isPending ||
    importMut.isPending ||
    startDownloadMut.isPending ||
    importInProgress ||
    listDiscoveryActive;

  function toggleListId(id: string, checked: boolean) {
    if (importedListIdSet.has(id)) return;
    setSelectedListIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      for (const importedId of importedListIds) {
        next.add(importedId);
      }
      return next;
    });
  }

  function selectAllLists() {
    setSelectedListIds(new Set(importListOptions.map((option) => option.id)));
  }

  function deselectAllLists() {
    const valid = new Set(importListOptions.map((option) => option.id));
    setSelectedListIds(new Set(importedListIds.filter((id) => valid.has(id))));
  }

  const resolvedHasExportCache =
    hasExportCache || sourcesQuery.data?.hasExportCache === true;

  const initialWizardStep = resolveInitialWizardStep({
    importInProgress,
    listDiscoveryActive,
    listDiscoveryFailed,
    hasExportCache: resolvedHasExportCache,
  });

  const importButtonLabel = resolveImportButtonLabel({
    importInProgress,
    listDiscoveryActive,
    listDiscoveryFailed,
    lastSyncAt,
    hasExportCache: resolvedHasExportCache,
  });

  return {
    readOnly,
    pluginGloballyEnabled,
    parsed,
    importedListIds,
    linked,
    selectedListIds,
    toggleListId,
    selectAllLists,
    deselectAllLists,
    importListOptions,
    busy,
    importInProgress,
    importActive,
    importJob,
    importButtonLabel,
    lastSyncAt,
    isOneTimeAccess,
    saveConfig,
    importMut,
    startDownloadMut,
    selectedSources,
    sourcesQuery,
    statusQuery,
    listDiscoveryJob,
    listDiscoveryActive,
    listDiscoveryFailed,
    hasExportCache:
      hasExportCache || sourcesQuery.data?.hasExportCache === true,
    listCount: statusQuery.data?.listCount ?? sourcesQuery.data?.listCount ?? 0,
    lastExportAt:
      statusQuery.data?.lastExportAt ?? sourcesQuery.data?.lastExportAt,
    initialWizardStep,
    wizardImportResult,
    clearWizardImportResult: () => setWizardImportResult(null),
  };
}

export type GoogleMapsMapImportState = ReturnType<
  typeof useGoogleMapsMapImport
>;
