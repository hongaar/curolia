/** Per-map iCalendar plugin settings stored in `map_plugins.config`. */
export type IcalMapPluginConfig = {
  publishFeed?: boolean;
};

export const ICAL_PLUGIN_ID = "ical" as const;

export function parseIcalMapConfig(
  raw: Record<string, unknown> | undefined | null,
): IcalMapPluginConfig {
  if (!raw || typeof raw !== "object") return {};
  return {
    publishFeed: raw.publishFeed === true,
  };
}
