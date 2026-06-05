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
  SyncJobsDeclaration,
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
export {
  PIN_METADATA_SHOW_FIELD_KEYS,
  PIN_METADATA_SHOW_GROUPS,
  PIN_METADATA_SUBTITLE_FIELD_KEYS,
  defaultPinMetadataShowSettings,
  filterPinMetadataForDetailDisplay,
  hasPinMetadataDetailDisplayEnabled,
  isPinMetadataFieldShown,
  isPinMetadataItemVisible,
  isPinMetadataShowFieldKey,
  isPinMetadataSubtitleField,
  normalizePinMetadataShowSettings,
  pinMetadataShowSelectItems,
  pinMetadataShowSelectSummary,
  pinMetadataShowSettingsEqual,
  pinMetadataShowSettingsForStorage,
  resolveMapPinMetadataShow,
  type PinMetadataShowFieldKey,
  type PinMetadataShowGroup,
  type PinMetadataShowSettings,
  type PinMetadataSubtitleFieldKey,
} from "./map-pin-metadata-display";
export {
  PIN_METADATA_DISPLAY_ORDER,
  PIN_METADATA_FIELD_KEYS,
  formatOpeningHoursDisplay,
  formatPinMetadataWebsiteLabel,
  groupPinMetadataForDisplay,
  isPinMetadataFieldKey,
  normalizePhoneTel,
  normalizeWebsiteUrl,
  parsePinMetadataRow,
  parsePinMetadataValue,
  pinMetadataFieldLabel,
  pinMetadataRowByField,
  pinMetadataWebsiteDisplayLabel,
  type PinMetadataDietaryOptionsValue,
  type PinMetadataDisplayItem,
  type PinMetadataDogPolicyValue,
  type PinMetadataEmailValue,
  type PinMetadataFieldKey,
  type PinMetadataLabelValue,
  type PinMetadataOpeningHoursValue,
  type PinMetadataPhoneValue,
  type PinMetadataPlaceCategoriesValue,
  type PinMetadataRow,
  type PinMetadataUpsert,
  type PinMetadataValueByKey,
  type PinMetadataWebsiteValue,
  type PinMetadataWheelchairAccessValue,
} from "./pin-metadata";
export {
  replacePinMetadataForSource,
  type PublishPinMetadataArgs,
} from "./pin-metadata-publish";
export {
  pinMetadataSubtitleFromRows,
  type PinMetadataSubtitle,
  type PinMetadataSubtitlePart,
} from "./pin-metadata-subtitle";
export {
  isPluginSyncJobActive,
  PLUGIN_SYNC_DISPATCH_SECRET_ENV,
  PLUGIN_SYNC_EVENT_PIN_COORDINATES_CHANGED,
  pluginSyncEventsFromConfig,
  withPluginSyncEvents,
  type PluginSyncEvent,
  type PluginSyncJobRow,
  type PluginSyncJobStatus,
} from "./sync-jobs";

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
