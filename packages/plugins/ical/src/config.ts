/** Per-map iCalendar plugin settings stored in `map_plugins.config`. */
export type IcalMapPluginConfig = {
  publishFeed?: boolean;
  /** Opaque UUID for unguessable public feed URLs. */
  feedToken?: string;
};

export const ICAL_PLUGIN_ID = "ical" as const;

const FEED_TOKEN_RE = /^[0-9a-f-]{36}$/i;

export function parseIcalMapConfig(
  raw: Record<string, unknown> | undefined | null,
): IcalMapPluginConfig {
  if (!raw || typeof raw !== "object") return {};
  const feedToken =
    typeof raw.feedToken === "string" && FEED_TOKEN_RE.test(raw.feedToken)
      ? raw.feedToken
      : undefined;
  return {
    publishFeed: raw.publishFeed === true,
    feedToken,
  };
}
