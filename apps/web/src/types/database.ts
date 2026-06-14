export type MapMemberRole = "owner" | "editor" | "viewer";
export type MapInvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled";
export type NotificationType =
  | "map_invitation"
  | "map_invitation_accepted"
  | "map_ownership_received"
  | "pin_comment"
  | "pin_reaction";
export type PluginLinkStatus = "disabled" | "pending" | "error" | "connected";

export type Profile = {
  id: string;
  /** URL-safe slug, globally unique. */
  slug: string;
  display_name: string | null;
  /** Short optional bio for public map blog attribution. */
  bio: string | null;
  avatar_url: string | null;
  default_map_id: string | null;
  notification_email_enabled: boolean;
  notification_push_enabled: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

/** User-owned map (collection of pins). Named `CuroliaMap` to avoid clashing with JS `Map`. */
export type CuroliaMap = {
  id: string;
  name: string;
  slug: string;
  is_public: boolean;
  /** When true with is_public, discourage crawlers from indexing public URLs. */
  block_public_crawlers: boolean;
  /** When null, UI uses defaultMapIcon(). */
  icon_emoji: string | null;
  /** Basemap preset; `auto` follows app light/dark theme. */
  style: import("@/lib/map-style").MapStylePreset;
  /** Terrain hillshade overlay when `style` is `street`. */
  style_hillshades: boolean;
  /** Reference labels overlay when `style` is `satellite`. */
  style_satellite_labels: boolean;
  /** Connect dated pins with route lines on the map view. */
  show_pin_route: boolean;
  /** Per-field pin metadata visibility (`{ fields: string[] }`). */
  show_pin_metadata?: import("@/lib/database.types").Json | null;
  /** Per-plugin pin output visibility (`{ [pluginId]: boolean }`; false hides). */
  show_plugin_outputs?: import("@/lib/database.types").Json | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
};

export type MapMember = {
  map_id: string;
  user_id: string;
  role: MapMemberRole;
  created_at: string;
};

export type Pin = {
  id: string;
  map_id: string;
  /** URL-safe slug, unique within the map. */
  slug: string;
  title: string | null;
  description: string | null;
  /** Photon reverse-geocode snapshot; client derives the location label. */
  geocode: import("@curolia/services/geocoding").PinGeocode | null;
  /** Granularity for the derived location label. */
  location_label_detail: import("@curolia/services/geocoding").LocationLabelDetail;
  lat: number;
  lng: number;
  /** Start calendar day (YYYY-MM-DD), optional. */
  date: string | null;
  /** Inclusive end day, optional; must be >= date when both are set. */
  end_date: string | null;
  /** User who created this pin (insert). */
  created_by_user_id: string | null;
  /** User who last updated this pin. */
  modified_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Tag = {
  id: string;
  map_id: string;
  name: string;
  /** URL-safe slug, unique within the map. */
  slug: string;
  color: string;
  /** Optional emoji glyph; null markers fall back to a solid tag color. */
  icon_emoji: string | null;
  created_at: string;
  updated_at: string;
};

export type PinTagRow = {
  pin_id: string;
  tag_id: string;
};

export type Photo = {
  id: string;
  map_id: string;
  pin_id: string;
  storage_path: string | null;
  sort_order: number;
  created_at: string;
  source_plugin_id: string | null;
  external_ref: Record<string, unknown> | null;
  captured_at: string | null;
  width: number | null;
  height: number | null;
};

export type PinLink = {
  id: string;
  map_id: string;
  pin_id: string;
  url: string;
  /** Page title imported from the URL when added (editable). */
  title: string | null;
  /** Page description imported from the URL when added. */
  description: string | null;
  /** Preview image URL imported from the URL when added. */
  image_url: string | null;
  /** Resolved favicon URL discovered when the link was added. */
  favicon_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

/** Provider-agnostic structured facts on a pin (`pin_metadata`). */
export type PinMetadata = {
  id: string;
  map_id: string;
  pin_id: string;
  field_key: string;
  source_plugin_id: string;
  value: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

/** Generic plugin payload row (see `plugin_entity_data` migration). */
export type PluginEntityData = {
  id: string;
  map_id: string;
  /** Discriminator for which table `entity_id` references; today only `pin`. */
  entity_type: string;
  entity_id: string;
  plugin_type_id: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type MapPlugin = {
  id: string;
  map_id: string;
  plugin_type_id: string;
  enabled: boolean;
  config: Record<string, unknown>;
  status: PluginLinkStatus;
  created_at: string;
  updated_at: string;
};

/** Account-wide plugin toggle and credentials (`user_plugins`). */
export type UserPlugin = {
  id: string;
  user_id: string;
  plugin_type_id: string;
  enabled: boolean;
  config: Record<string, unknown>;
  status: PluginLinkStatus;
  created_at: string;
  updated_at: string;
};

export type MapInvitation = {
  id: string;
  map_id: string;
  invitee_email: string;
  invited_role: MapMemberRole;
  invited_by_user_id: string;
  token: string;
  status: MapInvitationStatus;
  created_at: string;
  expires_at: string;
};

export type AppNotification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  payload: Record<string, unknown>;
  action_path: string | null;
  read_at: string | null;
  created_at: string;
};

/** Minimal Database typing for Supabase client generics */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      maps: {
        Row: CuroliaMap;
        Insert: Partial<CuroliaMap> & {
          name: string;
          created_by_user_id: string;
        };
        Update: Partial<CuroliaMap>;
      };
      map_members: {
        Row: MapMember;
        Insert: {
          map_id: string;
          user_id: string;
          role?: MapMemberRole;
        };
        Update: Partial<MapMember>;
      };
      pins: {
        Row: Pin;
        Insert: Omit<
          Pin,
          | "id"
          | "slug"
          | "created_at"
          | "updated_at"
          | "created_by_user_id"
          | "modified_by_user_id"
        > & {
          id?: string;
          /** Omitted when `public.pins_set_slug()` assigns from `title`. */
          slug?: string;
          created_by_user_id?: string | null;
          modified_by_user_id?: string | null;
        };
        Update: Partial<Pin>;
      };
      tags: {
        Row: Tag;
        Insert: Omit<Tag, "id" | "created_at" | "updated_at" | "slug"> & {
          id?: string;
          /** Omitted when `public.tags_set_slug()` assigns from `name`. */
          slug?: string;
        };
        Update: Partial<Tag>;
      };
      pin_tags: {
        Row: PinTagRow;
        Insert: PinTagRow;
        Update: PinTagRow;
      };
      photos: {
        Row: Photo;
        Insert: Omit<Photo, "id" | "created_at"> & { id?: string };
        Update: Partial<Photo>;
      };
      pin_links: {
        Row: PinLink;
        Insert: Omit<PinLink, "id" | "map_id" | "created_at" | "updated_at"> & {
          id?: string;
          /** Set automatically by trigger from the parent pin. */
          map_id?: string;
        };
        Update: Partial<PinLink>;
      };
      pin_metadata: {
        Row: PinMetadata;
        Insert: Omit<
          PinMetadata,
          "id" | "map_id" | "created_at" | "updated_at"
        > & {
          id?: string;
          /** Set automatically by trigger from the parent pin. */
          map_id?: string;
        };
        Update: Partial<
          Pick<
            PinMetadata,
            "field_key" | "source_plugin_id" | "value" | "map_id" | "pin_id"
          >
        >;
      };
      plugin_entity_data: {
        Row: PluginEntityData;
        Insert: Omit<PluginEntityData, "id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<
          Pick<
            PluginEntityData,
            "data" | "map_id" | "entity_type" | "entity_id" | "plugin_type_id"
          >
        >;
      };
      map_plugins: {
        Row: MapPlugin;
        Insert: Omit<MapPlugin, "id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<MapPlugin>;
      };
      user_plugins: {
        Row: UserPlugin;
        Insert: Omit<UserPlugin, "id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<UserPlugin>;
      };
      map_invitations: {
        Row: MapInvitation;
        Insert: never;
        Update: Partial<Pick<MapInvitation, "status">>;
      };
      notifications: {
        Row: AppNotification;
        Insert: never;
        Update: Partial<Pick<AppNotification, "read_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      map_member_role: MapMemberRole;
      map_invitation_status: MapInvitationStatus;
      notification_type: NotificationType;
      plugin_link_status: PluginLinkStatus;
    };
  };
};
