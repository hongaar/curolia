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
  type PinMetadataPlaceFactsValue,
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
