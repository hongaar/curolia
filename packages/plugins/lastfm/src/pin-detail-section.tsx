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
import { isLastfmEnabledForMap } from "./config";
import { LASTFM_SYNC_STALE_TIME_MS } from "./constants";
import { LastfmIcon } from "./icon";
import { lastfmSyncPinListening } from "./lastfm-edge";
import { parseLastfmPinPayload } from "./lastfm-pin-data";
import { lastfmPluginMeta } from "./plugin-meta";
import {
  lastfmPinSyncQueryKey,
  pluginEntityDataRowQueryKey,
} from "./query-keys";

function hasLastfmUsername(config: unknown): boolean {
  if (!config || typeof config !== "object") return false;
  const lf = (config as { lastfm?: unknown }).lastfm;
  if (!lf || typeof lf !== "object") return false;
  const u = (lf as { username?: unknown }).username;
  return typeof u === "string" && u.trim().length > 0;
}

export function LastfmPinDetailSection({
  supabase,
  userId,
  mapId,
  pinId,
  pinDate,
  pinEndDate,
}: PinContextProps) {
  const qc = useQueryClient();
  const pid = lastfmPluginMeta.typeId;

  const mapPluginQuery = useQuery({
    queryKey: ["map_plugins", mapId, pid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("map_plugins")
        .select("enabled")
        .eq("map_id", mapId)
        .eq("plugin_type_id", pid)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(mapId),
    placeholderData: keepPreviousData,
  });

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

  const mapEnabled = isLastfmEnabledForMap(mapPluginQuery.data);

  const pluginReady =
    mapEnabled &&
    Boolean(userPluginQuery.data?.enabled) &&
    hasLastfmUsername(userPluginQuery.data?.config) &&
    lastfmPluginMeta.implemented;

  const hasPeriod = Boolean(pinDate?.trim());

  const dataRowQueryKey = useMemo(
    () => pluginEntityDataRowQueryKey(pid, "pin", pinId),
    [pid, pinId],
  );

  const syncQuery = useQuery({
    queryKey: lastfmPinSyncQueryKey(pinId, pinDate, pinEndDate),
    queryFn: () => lastfmSyncPinListening(supabase, pinId),
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
    if (
      "skippedReason" in d &&
      (d.skippedReason === "no_pin_date" ||
        d.skippedReason === "map_plugin_disabled")
    ) {
      void qc.invalidateQueries({ queryKey: [...dataRowQueryKey] });
    }
  }, [syncQuery.isSuccess, syncQuery.data, qc, dataRowQueryKey]);

  if (!pluginReady) return null;

  if (!hasPeriod) {
    return (
      <PluginPinCard>
        <PluginPinHeader>
          <PluginPinTitleRow icon={<LastfmIcon />} title="Last.fm" />
        </PluginPinHeader>
        <PluginPinContent>
          <PluginPinMuted>
            Add a date to this pin to load your most-played tracks on Last.fm
            during that period.
          </PluginPinMuted>
        </PluginPinContent>
      </PluginPinCard>
    );
  }

  const rawData = rowQuery.data?.data;
  const payload = parseLastfmPinPayload(rawData);
  const busy = syncQuery.isFetching || rowQuery.isFetching;
  const syncFailed = syncQuery.isError;
  const errMsg =
    syncQuery.error instanceof Error ? syncQuery.error.message : null;

  return (
    <PluginPinCard>
      <PluginPinHeader between>
        <PluginPinTitleRow icon={<LastfmIcon />} title="Last.fm" />
        {busy ? <PluginPinSpinner /> : null}
      </PluginPinHeader>
      <PluginPinContent>
        {syncFailed ? (
          <PluginPinError>
            {errMsg ?? "Could not sync Last.fm data."}
          </PluginPinError>
        ) : null}
        {!payload?.tracks?.length && !busy && !syncFailed ? (
          <PluginPinMutedStack>
            <p>No scrobbles matched this pin&apos;s date range.</p>
            <PluginPinMutedXs>
              Last.fm returns your listening history for the pin window. Dates
              use UTC calendar boundaries (midnight–end of day UTC).
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
