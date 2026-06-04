export type {
  PluginAccountPanelProps,
  PluginAccountSettingsComponent,
  PluginOAuthLinkStatusResult,
  PluginOAuthShellHandlers,
  PluginUserPluginSnapshot,
} from "./account-panel";
export type {
  AppHookDeclaration,
  EdgeFunctionDeclaration,
  GlobalSettingField,
  GlobalSettingsDeclaration,
  MapSettingsDeclaration,
  PluginContributions,
  PluginOAuthDeclaration,
} from "./contributions";
export type {
  MapSettingsPanelProps,
  PinContextProps,
  PinDraftEnrichmentSlotProps,
  PinEditorFieldSuggestion,
  PinPhotoImportSlotProps,
  PluginDefinition,
  PluginPackageManifest,
  PluginRegistry,
} from "./definition";
export {
  mapPluginConfigRecord,
  mergeMapPluginConfig,
  type MapPluginLike,
} from "./map-config";

/** Pin photo suggestion payload (plugins return from Edge or client bridges). */
export type PinPhotoSuggestionContext = {
  pinId: string;
  mapId: string;
  date: string | null;
  endDate: string | null;
  lat: number;
  lng: number;
  /** Search radius in meters (shell default if unset). */
  radiusM?: number;
};

export type PinPhotoSuggestion = {
  externalId: string;
  thumbnailUrl?: string;
  title?: string;
  capturedAt?: string;
  /** Distance from pin center in meters when known. */
  distanceM?: number;
  meta?: Record<string, unknown>;
};
