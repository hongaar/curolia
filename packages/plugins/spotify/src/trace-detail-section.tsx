import type { TraceContextProps } from "@curolia/plugin-contract";
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
} from "@curolia/ui/plugin-trace";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Music } from "lucide-react";
import { useEffect, useMemo } from "react";
import {
  SPOTIFY_SYNC_STALE_TIME_MS,
  SPOTIFY_TOP_TRACKS_LIMIT,
} from "./constants";
import { SpotifyIcon } from "./icon";
import { spotifyPluginMeta } from "./plugin-meta";
import {
  pluginEntityDataRowQueryKey,
  spotifyTraceSyncQueryKey,
} from "./query-keys";
import { spotifySyncTraceListening } from "./spotify-edge";
import { parseSpotifyTracePayload } from "./spotify-trace-data";

export function SpotifyTraceDetailSection({
  supabase,
  userId,
  traceId,
  traceDate,
  traceEndDate,
}: TraceContextProps) {
  const qc = useQueryClient();
  const pid = spotifyPluginMeta.typeId;

  const userPluginQuery = useQuery({
    queryKey: ["user_plugins", userId, pid],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("user_plugins")
        .select("enabled, status")
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
    userPluginQuery.data?.status === "connected" &&
    spotifyPluginMeta.implemented;

  const hasPeriod = Boolean(traceDate?.trim());

  const dataRowQueryKey = useMemo(
    () => pluginEntityDataRowQueryKey(pid, "trace", traceId),
    [pid, traceId],
  );

  const syncQuery = useQuery({
    queryKey: spotifyTraceSyncQueryKey(traceId, traceDate, traceEndDate),
    queryFn: () => spotifySyncTraceListening(supabase, traceId),
    enabled: pluginReady && hasPeriod,
    staleTime: SPOTIFY_SYNC_STALE_TIME_MS,
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
          <PluginTraceTitleRow icon={<SpotifyIcon />} title="Spotify" />
        </PluginTraceHeader>
        <PluginTraceContent>
          <PluginTraceMuted>
            Add a date to this trace to load your most-played tracks on Spotify
            during that period (up to {SPOTIFY_TOP_TRACKS_LIMIT}).
          </PluginTraceMuted>
        </PluginTraceContent>
      </PluginTraceCard>
    );
  }

  const rawData = rowQuery.data?.data;
  const payload = parseSpotifyTracePayload(rawData);
  const busy = syncQuery.isFetching || rowQuery.isFetching;
  const syncFailed = syncQuery.isError;
  const errMsg =
    syncQuery.error instanceof Error ? syncQuery.error.message : null;

  return (
    <PluginTraceCard>
      <PluginTraceHeader between>
        <PluginTraceTitleRow icon={<SpotifyIcon />} title="Spotify" />
        {busy ? <PluginTraceSpinner /> : null}
      </PluginTraceHeader>
      <PluginTraceContent>
        {syncFailed ? (
          <PluginTraceError>
            {errMsg ?? "Could not sync Spotify data."}
          </PluginTraceError>
        ) : null}
        {!payload?.tracks?.length && !busy && !syncFailed ? (
          <PluginTraceMutedStack>
            <p>
              No streams in this trace&apos;s dates matched Spotify&apos;s
              recently-played feed from the Web API.
            </p>
            <PluginTraceMutedXs>
              Spotify&apos;s Web API only returns a shallow, rolling
              &quot;recently played&quot; stream—not full playback history by
              calendar day—so listening from older periods usually isn&apos;t
              visible here. Trace dates use UTC calendar boundaries
              (midnight–end of day UTC).
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
