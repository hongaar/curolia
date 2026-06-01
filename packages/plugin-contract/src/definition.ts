import type { PluginContributions } from "./contributions";
import type { PluginAccountSettingsComponent } from "./account-panel";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ComponentType } from "react";

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

/** Shared pin-scoped props for plugin surfaces (photo slots, pin detail panels, …). */
export type PinContextProps = PinPhotoImportSlotProps;

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
   * Optional block on the pin detail page (plugin-owned UI + data loaded via plugin routes).
   */
  PinDetailSection?: ComponentType<PinContextProps>;
};

export type PluginRegistry = Record<string, PluginDefinition>;

export type PluginPackageManifest = PluginDefinition;
