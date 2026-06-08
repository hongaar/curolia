/**
 * Declarative description of app-wide plugin settings (e.g. OAuth client IDs,
 * API keys stored in env or a future `app_plugin_settings` table).
 * The web shell can render forms from this metadata later.
 */
export type GlobalSettingField =
  | ({
      kind: "section";
      label: string;
      description?: string;
    } & { children: GlobalSettingField[] })
  | ({
      kind: "oauth" | "api_key" | "text" | "url" | "boolean";
      key: string;
      label: string;
      description?: string;
      /** Suggested env var name for documentation / codegen */
      envVar?: string;
    } & { children?: never });

export type GlobalSettingsDeclaration = {
  title: string;
  fields: GlobalSettingField[];
};

/**
 * Per-map settings (stored in `map_plugins.config` or dedicated tables).
 * UI registration stays in the app shell; this describes intent for docs and tooling.
 */
export type MapSettingsDeclaration = {
  /** How the web app should mount plugin-specific panels */
  panel: "inline" | "modal";
  title?: string;
};

/**
 * Named extension points for web/mobile (e.g. photo suggestions for a pin).
 * Runtime: app registers handlers; plugins only declare names for discovery.
 */
export type AppHookDeclaration = {
  /** Dot-separated namespaced id, e.g. `photos.suggestionsForPin` */
  name: string;
  description: string;
};

/**
 * Edge Function deployed via Supabase (source under plugin package;
 * synced into `packages/supabase/supabase/functions/`).
 */
export type EdgeFunctionDeclaration = {
  slug: string;
  verifyJwt?: boolean;
  description?: string;
};

/** OAuth metadata for Edge-initiated flows (no secrets in manifest). */
export type PluginOAuthDeclaration = {
  provider: "google" | string;
  scopes: readonly string[];
};

/**
 * Declares backend sync jobs processed by a plugin-owned `*-dispatch` Edge function.
 * Subscriptions are stored per map in `map_plugins.config.syncEvents` (not in SQL).
 */
export type SyncJobsDeclaration = {
  /** Events this plugin handles (must match keys written to `map_plugins.config.syncEvents`). */
  events: readonly string[];
  /** Edge function slug for the dispatch worker, e.g. `poi-dispatch`. */
  dispatchFunctionSlug: string;
  /**
   * Env var for the dispatch bearer secret (convention:
   * `PLUGIN_SYNC_DISPATCH_SECRET`; see `@curolia/plugin-contract` sync-jobs).
   */
  dispatchSecretEnvVar?: string;
};

export type PluginContributions = {
  globalSettings?: GlobalSettingsDeclaration;
  mapSettings?: MapSettingsDeclaration;
  appHooks?: AppHookDeclaration[];
  edgeFunctions?: EdgeFunctionDeclaration[];
  oauth?: PluginOAuthDeclaration[];
  syncJobs?: SyncJobsDeclaration;
};
