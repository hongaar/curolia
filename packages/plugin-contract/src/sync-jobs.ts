/** Standard sync events plugins may subscribe to via `map_plugins.config.syncEvents`. */
export const PLUGIN_SYNC_EVENT_PIN_COORDINATES_CHANGED =
  "pin_coordinates_changed" as const;

export type PluginSyncEvent =
  | typeof PLUGIN_SYNC_EVENT_PIN_COORDINATES_CHANGED
  | (string & {});

export type PluginSyncJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

/** Row shape for `public.plugin_sync_jobs` (client read via RLS). */
export type PluginSyncJobRow = {
  id: string;
  plugin_type_id: string;
  entity_type: string;
  entity_id: string;
  map_id: string;
  event: string;
  payload: Record<string, unknown>;
  status: PluginSyncJobStatus;
  attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

/** Env var shared by plugin `*-dispatch` Edge functions (self-generated secret). */
export const PLUGIN_SYNC_DISPATCH_SECRET_ENV = "PLUGIN_SYNC_DISPATCH_SECRET";

export function pluginSyncEventsFromConfig(
  config: Record<string, unknown> | undefined | null,
): string[] {
  const raw = config?.syncEvents;
  if (!Array.isArray(raw)) return [];
  return raw.filter((e): e is string => typeof e === "string" && e.length > 0);
}

/** Replace `config.syncEvents` (used when toggling map plugin sync). */
export function withPluginSyncEvents(
  config: Record<string, unknown>,
  events: readonly string[],
): Record<string, unknown> {
  return { ...config, syncEvents: [...events] };
}

export function isPluginSyncJobActive(
  status: PluginSyncJobStatus | undefined | null,
): boolean {
  return status === "pending" || status === "processing";
}
