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
  PluginDefinition,
  PluginPackageManifest,
  PluginRegistry,
  PinContextProps,
  PinPhotoImportSlotProps,
} from "./definition";
export type {
  PluginAccountPanelProps,
  PluginAccountSettingsComponent,
  PluginOAuthLinkStatusResult,
  PluginOAuthShellHandlers,
  PluginUserPluginSnapshot,
} from "./account-panel";
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
