import type { PinContextProps } from "@curolia/plugin-contract";
import {
  PluginPinCard,
  PluginPinContent,
  PluginPinError,
  PluginPinHeader,
  PluginPinLink,
  PluginPinLinkMeta,
  PluginPinList,
  PluginPinMuted,
  PluginPinMutedStack,
  PluginPinMutedXs,
  PluginPinSpinner,
  PluginPinTitleRow,
} from "@curolia/ui/plugin-pin";
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
  spotifyPinSyncQueryKey,
} from "./query-keys";
import { spotifySyncPinListening } from "./spotify-edge";
import { parseSpotifyPinPayload } from "./spotify-pin-data";

export function SpotifyPinDetailSection({
  supabase,
  userId,
  pinId,
  pinDate,
  pinEndDate,
}: PinContextProps) {
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

  const hasPeriod = Boolean(pinDate?.trim());

  const dataRowQueryKey = useMemo(
    () => pluginEntityDataRowQueryKey(pid, "pin", pinId),
    [pid, pinId],
  );

  const syncQuery = useQuery({
    queryKey: spotifyPinSyncQueryKey(pinId, pinDate, pinEndDate),
    queryFn: () => spotifySyncPinListening(supabase, pinId),
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
        .eq("entity_type", "pin")
        .eq("entity_id", pinId)
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
    if ("skippedReason" in d && d.skippedReason === "no_pin_date") {
      void qc.invalidateQueries({ queryKey: [...dataRowQueryKey] });
    }
  }, [syncQuery.isSuccess, syncQuery.data, qc, dataRowQueryKey]);

  if (!pluginReady) return null;

  if (!hasPeriod) {
    return (
      <PluginPinCard>
        <PluginPinHeader>
          <PluginPinTitleRow icon={<SpotifyIcon />} title="Spotify" />
        </PluginPinHeader>
        <PluginPinContent>
          <PluginPinMuted>
            Add a date to this pin to load your most-played tracks on Spotify
            during that period (up to {SPOTIFY_TOP_TRACKS_LIMIT}).
          </PluginPinMuted>
        </PluginPinContent>
      </PluginPinCard>
    );
  }

  const rawData = rowQuery.data?.data;
  const payload = parseSpotifyPinPayload(rawData);
  const busy = syncQuery.isFetching || rowQuery.isFetching;
  const syncFailed = syncQuery.isError;
  const errMsg =
    syncQuery.error instanceof Error ? syncQuery.error.message : null;

  return (
    <PluginPinCard>
      <PluginPinHeader between>
        <PluginPinTitleRow icon={<SpotifyIcon />} title="Spotify" />
        {busy ? <PluginPinSpinner /> : null}
      </PluginPinHeader>
      <PluginPinContent>
        {syncFailed ? (
          <PluginPinError>
            {errMsg ?? "Could not sync Spotify data."}
          </PluginPinError>
        ) : null}
        {!payload?.tracks?.length && !busy && !syncFailed ? (
          <PluginPinMutedStack>
            <p>
              No streams in this pin&apos;s dates matched Spotify&apos;s
              recently-played feed from the Web API.
            </p>
            <PluginPinMutedXs>
              Spotify&apos;s Web API only returns a shallow, rolling
              &quot;recently played&quot; stream—not full playback history by
              calendar day—so listening from older periods usually isn&apos;t
              visible here. Pin dates use UTC calendar boundaries (midnight–end
              of day UTC).
            </PluginPinMutedXs>
          </PluginPinMutedStack>
        ) : null}
        {payload?.tracks?.length ? (
          <PluginPinList>
            {payload.tracks.map((row) => (
              <PluginPinLink
                key={row.trackId}
                href={row.openUrl}
                icon={<Music />}
              >
                <span>
                  {row.title}
                  <PluginPinLinkMeta> · {row.playCount}×</PluginPinLinkMeta>
                </span>
              </PluginPinLink>
            ))}
          </PluginPinList>
        ) : null}
        {payload?.limitedByPagination ? (
          <PluginPinMutedXs>
            Partial history: pagination cap reached; counts may not reflect your
            full listening for this window.
          </PluginPinMutedXs>
        ) : null}
      </PluginPinContent>
    </PluginPinCard>
  );
}
