import type { SupabaseClient } from "@supabase/supabase-js";
import type { ComponentType } from "react";
import type { PluginAccountSettingsComponent } from "./account-panel";
import type { PluginContributions } from "./contributions";
import type { MapPluginLike } from "./map-config";

/** Props for optional pin editor UI next to native photo upload (cloud library importers). */
export type PinPhotoImportSlotProps = {
  supabase: SupabaseClient;
  /** Current signed-in user id (shell reads from auth); omit when logged out. */
  userId?: string | null;
  pinId: string;
  mapId: string;
  pinDate?: string | null;
  pinEndDate?: string | null;
};

/** Title/description fields a plugin may suggest in the pin editor. */
export type PinEditorFieldSuggestion = {
  title?: string;
  description?: string;
};

/** Shared pin-scoped props for plugin surfaces (photo slots, pin detail panels, …). */
export type PinContextProps = PinPhotoImportSlotProps & {
  /** Coordinates from the open pin form (edit flow); omit on read-only surfaces. */
  pinLat?: number | null;
  pinLng?: number | null;
  hasPinTitle?: boolean;
  hasPinDescription?: boolean;
  onApplyPinSuggestion?: (fields: PinEditorFieldSuggestion) => void;
};

/** Props for plugin enrichment while drafting a new pin (before `pinId` exists). */
export type PinDraftEnrichmentSlotProps = {
  supabase: SupabaseClient;
  userId?: string | null;
  mapId: string;
  lat: number;
  lng: number;
  hasTitle: boolean;
  hasDescription: boolean;
  onApplySuggestion: (fields: PinEditorFieldSuggestion) => void;
};

/** Props for per-map plugin settings panels rendered in the map settings dialog. */
export type MapSettingsPanelProps = {
  supabase: SupabaseClient;
  /** Resolved Supabase project base URL (platform-aware). Used by plugins that construct public URLs. */
  supabaseUrl?: string;
  mapId: string;
  /** Per-map plugin row; undefined when none saved yet. */
  jp: MapPluginLike | undefined;
  /** Whether the plugin is enabled for the current account. */
  pluginGloballyEnabled: boolean;
  readOnly?: boolean;
};

export type PluginIconComponent = ComponentType<{
  className?: string;
  size?: 4 | 5 | 6;
}>;

export type PluginDefinition = {
  id: string;
  displayName: string;
  description?: string;
  /** UI icon component provided by plugin package. */
  icon: PluginIconComponent;
  /** When false, UI shows that sync is not implemented yet */
  implemented: boolean;
  /** Optional metadata for settings UI, hooks registry, and Edge deploy lists */
  contributions?: PluginContributions;
  /**
   * Account-wide configuration rendered below the title/description + enabled toggle
   * (OAuth linking, API keys, etc.).
   */
  AccountSettingsPanel?: PluginAccountSettingsComponent;
  /**
   * Rendered inline next to “Upload photos” in the pin editor when the plugin can import
   * library media for an existing pin.
   */
  PinPhotoImportSlot?: ComponentType<PinPhotoImportSlotProps>;
  /**
   * Optional body for the pin editor plugin card (existing pins). The web shell
   * wraps this in a card with the plugin icon and display name.
   */
  PinFormSection?: ComponentType<PinContextProps>;
  /**
   * Optional read-only block on the pin detail page.
   */
  PinDetailSection?: ComponentType<PinContextProps>;
  /**
   * Optional enrichment while creating a new pin (no `pinId` yet). Rendered when
   * draft coordinates are valid.
   */
  PinDraftEnrichmentSlot?: ComponentType<PinDraftEnrichmentSlotProps>;
  /**
   * Optional per-map settings panel rendered inside the map settings dialog.
   * Replaces the hard-coded switch in the app shell.
   */
  MapSettingsPanel?: ComponentType<MapSettingsPanelProps>;
  /**
   * When true, {@link PinDetailSection} is rendered without the default plugin
   * card chrome (icon, title, bordered card). Use for embed-first surfaces.
   */
  pinDetailPlain?: boolean;
};

export type PluginRegistry = Record<string, PluginDefinition>;

export type PluginPackageManifest = PluginDefinition;
