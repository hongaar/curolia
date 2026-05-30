import type { TraceContextProps } from "@curolia/plugin-contract";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Loader2, Music } from "lucide-react";
import { useEffect, useMemo } from "react";
import {
  PluginTraceCard,
  PluginTraceContent,
  PluginTraceError,
  PluginTraceHeader,
  PluginTraceLink,
  PluginTraceLinkMeta,
  PluginTraceList,
  PluginTraceMuted,
  PluginTraceMutedStack,
  PluginTraceMutedXs,
  PluginTraceSpinner,
  PluginTraceTitleRow,
} from "@curolia/ui/curolia/plugin-trace-ui";
import {
  LASTFM_SYNC_STALE_TIME_MS,
  LASTFM_TOP_TRACKS_LIMIT,
} from "./constants";
import { LastfmIcon } from "./icon";
import { lastfmPluginMeta } from "./plugin-meta";
import {
  lastfmTraceSyncQueryKey,
  pluginEntityDataRowQueryKey,
} from "./query-keys";
import { lastfmSyncTraceListening } from "./lastfm-edge";
import { parseLastfmTracePayload } from "./lastfm-trace-data";

function hasLastfmUsername(config: unknown): boolean {
  if (!config || typeof config !== "object") return false;
  const lf = (config as { lastfm?: unknown }).lastfm;
  if (!lf || typeof lf !== "object") return false;
  const u = (lf as { username?: unknown }).username;
  return typeof u === "string" && u.trim().length > 0;
}

export function LastfmTraceDetailSection({
  supabase,
  userId,
  traceId,
  traceDate,
  traceEndDate,
}: TraceContextProps) {
  const qc = useQueryClient();
  const pid = lastfmPluginMeta.typeId;

  const userPluginQuery = useQuery({
    queryKey: ["user_plugins", userId, pid],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("user_plugins")
        .select("enabled, config")
        .eq("user_id", userId)
        .eq("plugin_type_id", pid)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  });

  const pluginReady =
    Boolean(userPluginQuery.data?.enabled) &&
    hasLastfmUsername(userPluginQuery.data?.config) &&
    lastfmPluginMeta.implemented;

  const hasPeriod = Boolean(traceDate?.trim());

  const dataRowQueryKey = useMemo(
    () => pluginEntityDataRowQueryKey(pid, "trace", traceId),
    [pid, traceId],
  );

  const syncQuery = useQuery({
    queryKey: lastfmTraceSyncQueryKey(traceId, traceDate, traceEndDate),
    queryFn: () => lastfmSyncTraceListening(supabase, traceId),
    enabled: pluginReady && hasPeriod,
    staleTime: LASTFM_SYNC_STALE_TIME_MS,
    retry: false,
  });

  const rowQuery = useQuery({
    queryKey: dataRowQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plugin_entity_data")
        .select("data, updated_at")
        .eq("entity_type", "trace")
        .eq("entity_id", traceId)
        .eq("plugin_type_id", pid)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: pluginReady,
  });

  useEffect(() => {
    if (!syncQuery.isSuccess || !syncQuery.data) return;
    const d = syncQuery.data;
    if ("synced" in d && d.synced) {
      void qc.invalidateQueries({ queryKey: [...dataRowQueryKey] });
    }
    if ("skippedReason" in d && d.skippedReason === "no_trace_date") {
      void qc.invalidateQueries({ queryKey: [...dataRowQueryKey] });
    }
  }, [syncQuery.isSuccess, syncQuery.data, qc, dataRowQueryKey]);

  if (!pluginReady) return null;

  if (!hasPeriod) {
    return (
      <PluginTraceCard>
        <PluginTraceHeader>
          <PluginTraceTitleRow icon={<LastfmIcon />} title="Last.fm" />
        </PluginTraceHeader>
        <PluginTraceContent>
          <PluginTraceMuted>
            Add a date to this trace to load your most-played tracks on Last.fm
            during that period (up to {LASTFM_TOP_TRACKS_LIMIT}).
          </PluginTraceMuted>
        </PluginTraceContent>
      </PluginTraceCard>
    );
  }

  const rawData = rowQuery.data?.data;
  const payload = parseLastfmTracePayload(rawData);
  const busy = syncQuery.isFetching || rowQuery.isFetching;
  const syncFailed = syncQuery.isError;
  const errMsg =
    syncQuery.error instanceof Error ? syncQuery.error.message : null;

  return (
    <PluginTraceCard>
      <PluginTraceHeader between>
        <PluginTraceTitleRow icon={<LastfmIcon />} title="Last.fm" />
        {busy ? (
          <PluginTraceSpinner>
            <Loader2 className="spin" />
          </PluginTraceSpinner>
        ) : null}
      </PluginTraceHeader>
      <PluginTraceContent>
        {syncFailed ? (
          <PluginTraceError>
            {errMsg ?? "Could not sync Last.fm data."}
          </PluginTraceError>
        ) : null}
        {!payload?.tracks?.length && !busy && !syncFailed ? (
          <PluginTraceMutedStack>
            <p>No scrobbles matched this trace&apos;s date range.</p>
            <PluginTraceMutedXs>
              Last.fm returns your listening history for the trace window. Dates
              use UTC calendar boundaries (midnight–end of day UTC).
            </PluginTraceMutedXs>
          </PluginTraceMutedStack>
        ) : null}
        {payload?.tracks?.length ? (
          <PluginTraceList>
            {payload.tracks.map((row) => (
              <PluginTraceLink
                key={row.trackId}
                href={row.openUrl}
                icon={<Music />}
              >
                <span>
                  {row.title}
                  <PluginTraceLinkMeta> · {row.playCount}×</PluginTraceLinkMeta>
                </span>
              </PluginTraceLink>
            ))}
          </PluginTraceList>
        ) : null}
        {payload?.limitedByPagination ? (
          <PluginTraceMutedXs>
            Partial history: pagination cap reached; counts may not reflect your
            full listening for this window.
          </PluginTraceMutedXs>
        ) : null}
      </PluginTraceContent>
    </PluginTraceCard>
  );
}
