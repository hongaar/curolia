export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      map_ical_feed_tokens: {
        Row: {
          created_at: string;
          map_id: string;
          token: string;
        };
        Insert: {
          created_at?: string;
          map_id: string;
          token?: string;
        };
        Update: {
          created_at?: string;
          map_id?: string;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "map_ical_feed_tokens_map_id_fkey";
            columns: ["map_id"];
            isOneToOne: true;
            referencedRelation: "maps";
            referencedColumns: ["id"];
          },
        ];
      };
      map_invitations: {
        Row: {
          created_at: string;
          expires_at: string;
          id: string;
          invited_by_user_id: string;
          invited_role: Database["public"]["Enums"]["map_member_role"];
          invitee_email: string;
          map_id: string;
          status: Database["public"]["Enums"]["map_invitation_status"];
          token: string;
        };
        Insert: {
          created_at?: string;
          expires_at?: string;
          id?: string;
          invited_by_user_id: string;
          invited_role: Database["public"]["Enums"]["map_member_role"];
          invitee_email: string;
          map_id: string;
          status?: Database["public"]["Enums"]["map_invitation_status"];
          token?: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          id?: string;
          invited_by_user_id?: string;
          invited_role?: Database["public"]["Enums"]["map_member_role"];
          invitee_email?: string;
          map_id?: string;
          status?: Database["public"]["Enums"]["map_invitation_status"];
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "map_invitations_map_id_fkey";
            columns: ["map_id"];
            isOneToOne: false;
            referencedRelation: "maps";
            referencedColumns: ["id"];
          },
        ];
      };
      map_members: {
        Row: {
          created_at: string;
          map_id: string;
          role: Database["public"]["Enums"]["map_member_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          map_id: string;
          role?: Database["public"]["Enums"]["map_member_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          map_id?: string;
          role?: Database["public"]["Enums"]["map_member_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "map_members_map_id_fkey";
            columns: ["map_id"];
            isOneToOne: false;
            referencedRelation: "maps";
            referencedColumns: ["id"];
          },
        ];
      };
      map_plugins: {
        Row: {
          config: Json;
          created_at: string;
          enabled: boolean;
          id: string;
          map_id: string;
          plugin_type_id: string;
          status: Database["public"]["Enums"]["plugin_link_status"];
          updated_at: string;
        };
        Insert: {
          config?: Json;
          created_at?: string;
          enabled?: boolean;
          id?: string;
          map_id: string;
          plugin_type_id: string;
          status?: Database["public"]["Enums"]["plugin_link_status"];
          updated_at?: string;
        };
        Update: {
          config?: Json;
          created_at?: string;
          enabled?: boolean;
          id?: string;
          map_id?: string;
          plugin_type_id?: string;
          status?: Database["public"]["Enums"]["plugin_link_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "map_connectors_map_id_fkey";
            columns: ["map_id"];
            isOneToOne: false;
            referencedRelation: "maps";
            referencedColumns: ["id"];
          },
        ];
      };
      maps: {
        Row: {
          created_at: string;
          created_by_user_id: string;
          icon_emoji: string | null;
          id: string;
          is_personal: boolean;
          name: string;
          slug: string;
          style: Database["public"]["Enums"]["map_style"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by_user_id: string;
          icon_emoji?: string | null;
          id?: string;
          is_personal?: boolean;
          name: string;
          slug?: string;
          style?: Database["public"]["Enums"]["map_style"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by_user_id?: string;
          icon_emoji?: string | null;
          id?: string;
          is_personal?: boolean;
          name?: string;
          slug?: string;
          style?: Database["public"]["Enums"]["map_style"];
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          action_path: string | null;
          body: string | null;
          created_at: string;
          id: string;
          payload: Json;
          read_at: string | null;
          title: string;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Insert: {
          action_path?: string | null;
          body?: string | null;
          created_at?: string;
          id?: string;
          payload?: Json;
          read_at?: string | null;
          title: string;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Update: {
          action_path?: string | null;
          body?: string | null;
          created_at?: string;
          id?: string;
          payload?: Json;
          read_at?: string | null;
          title?: string;
          type?: Database["public"]["Enums"]["notification_type"];
          user_id?: string;
        };
        Relationships: [];
      };
      photos: {
        Row: {
          captured_at: string | null;
          created_at: string;
          external_ref: Json | null;
          height: number | null;
          id: string;
          map_id: string;
          pin_id: string;
          sort_order: number;
          source_plugin_id: string | null;
          storage_path: string | null;
          width: number | null;
        };
        Insert: {
          captured_at?: string | null;
          created_at?: string;
          external_ref?: Json | null;
          height?: number | null;
          id?: string;
          map_id: string;
          pin_id: string;
          sort_order?: number;
          source_plugin_id?: string | null;
          storage_path?: string | null;
          width?: number | null;
        };
        Update: {
          captured_at?: string | null;
          created_at?: string;
          external_ref?: Json | null;
          height?: number | null;
          id?: string;
          map_id?: string;
          pin_id?: string;
          sort_order?: number;
          source_plugin_id?: string | null;
          storage_path?: string | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "photos_map_id_fkey";
            columns: ["map_id"];
            isOneToOne: false;
            referencedRelation: "maps";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "photos_pin_id_fkey";
            columns: ["pin_id"];
            isOneToOne: false;
            referencedRelation: "pins";
            referencedColumns: ["id"];
          },
        ];
      };
      pin_links: {
        Row: {
          created_at: string;
          favicon_url: string | null;
          id: string;
          map_id: string;
          pin_id: string;
          sort_order: number;
          title: string | null;
          updated_at: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          favicon_url?: string | null;
          id?: string;
          map_id: string;
          pin_id: string;
          sort_order?: number;
          title?: string | null;
          updated_at?: string;
          url: string;
        };
        Update: {
          created_at?: string;
          favicon_url?: string | null;
          id?: string;
          map_id?: string;
          pin_id?: string;
          sort_order?: number;
          title?: string | null;
          updated_at?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pin_links_map_id_fkey";
            columns: ["map_id"];
            isOneToOne: false;
            referencedRelation: "maps";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pin_links_pin_id_fkey";
            columns: ["pin_id"];
            isOneToOne: false;
            referencedRelation: "pins";
            referencedColumns: ["id"];
          },
        ];
      };
      pin_tags: {
        Row: {
          pin_id: string;
          tag_id: string;
        };
        Insert: {
          pin_id: string;
          tag_id: string;
        };
        Update: {
          pin_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pin_tags_pin_id_fkey";
            columns: ["pin_id"];
            isOneToOne: false;
            referencedRelation: "pins";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pin_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      pins: {
        Row: {
          created_at: string;
          created_by_user_id: string | null;
          date: string | null;
          description: string | null;
          end_date: string | null;
          geocode: Json | null;
          id: string;
          lat: number;
          lng: number;
          location_label_detail: string;
          map_id: string;
          modified_by_user_id: string | null;
          slug: string;
          title: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by_user_id?: string | null;
          date?: string | null;
          description?: string | null;
          end_date?: string | null;
          geocode?: Json | null;
          id?: string;
          lat: number;
          lng: number;
          location_label_detail?: string;
          map_id: string;
          modified_by_user_id?: string | null;
          slug?: string;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by_user_id?: string | null;
          date?: string | null;
          description?: string | null;
          end_date?: string | null;
          geocode?: Json | null;
          id?: string;
          lat?: number;
          lng?: number;
          location_label_detail?: string;
          map_id?: string;
          modified_by_user_id?: string | null;
          slug?: string;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pins_created_by_user_id_fkey";
            columns: ["created_by_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pins_map_id_fkey";
            columns: ["map_id"];
            isOneToOne: false;
            referencedRelation: "maps";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pins_modified_by_user_id_fkey";
            columns: ["modified_by_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      plugin_entity_data: {
        Row: {
          created_at: string;
          data: Json;
          entity_id: string;
          entity_type: string;
          id: string;
          map_id: string;
          plugin_type_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          data?: Json;
          entity_id: string;
          entity_type: string;
          id?: string;
          map_id: string;
          plugin_type_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          data?: Json;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          map_id?: string;
          plugin_type_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "plugin_entity_data_map_id_fkey";
            columns: ["map_id"];
            isOneToOne: false;
            referencedRelation: "maps";
            referencedColumns: ["id"];
          },
        ];
      };
      plugin_oauth_pending: {
        Row: {
          code_verifier: string;
          created_at: string;
          expires_at: string;
          plugin_type_id: string;
          redirect_after: string | null;
          state: string;
          user_id: string;
        };
        Insert: {
          code_verifier: string;
          created_at?: string;
          expires_at: string;
          plugin_type_id: string;
          redirect_after?: string | null;
          state: string;
          user_id: string;
        };
        Update: {
          code_verifier?: string;
          created_at?: string;
          expires_at?: string;
          plugin_type_id?: string;
          redirect_after?: string | null;
          state?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          default_map_id: string | null;
          display_name: string | null;
          id: string;
          notification_email_enabled: boolean;
          notification_push_enabled: boolean;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          default_map_id?: string | null;
          display_name?: string | null;
          id: string;
          notification_email_enabled?: boolean;
          notification_push_enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          default_map_id?: string | null;
          display_name?: string | null;
          id?: string;
          notification_email_enabled?: boolean;
          notification_push_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_default_map_fk";
            columns: ["default_map_id"];
            isOneToOne: false;
            referencedRelation: "maps";
            referencedColumns: ["id"];
          },
        ];
      };
      push_notification_outbox: {
        Row: {
          attempts: number;
          body: string | null;
          created_at: string;
          id: string;
          last_error: string | null;
          notification_id: string;
          payload: Json;
          platform: string;
          provider: string;
          sent_at: string | null;
          status: Database["public"]["Enums"]["push_delivery_status"];
          title: string;
          token: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          attempts?: number;
          body?: string | null;
          created_at?: string;
          id?: string;
          last_error?: string | null;
          notification_id: string;
          payload?: Json;
          platform: string;
          provider?: string;
          sent_at?: string | null;
          status?: Database["public"]["Enums"]["push_delivery_status"];
          title: string;
          token: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          attempts?: number;
          body?: string | null;
          created_at?: string;
          id?: string;
          last_error?: string | null;
          notification_id?: string;
          payload?: Json;
          platform?: string;
          provider?: string;
          sent_at?: string | null;
          status?: Database["public"]["Enums"]["push_delivery_status"];
          title?: string;
          token?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "push_notification_outbox_notification_id_fkey";
            columns: ["notification_id"];
            isOneToOne: false;
            referencedRelation: "notifications";
            referencedColumns: ["id"];
          },
        ];
      };
      push_tokens: {
        Row: {
          created_at: string;
          device_id: string | null;
          id: string;
          last_seen_at: string;
          platform: string;
          provider: string;
          token: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          device_id?: string | null;
          id?: string;
          last_seen_at?: string;
          platform: string;
          provider?: string;
          token: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          device_id?: string | null;
          id?: string;
          last_seen_at?: string;
          platform?: string;
          provider?: string;
          token?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          color: string;
          created_at: string;
          icon_emoji: string;
          id: string;
          map_id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          icon_emoji?: string;
          id?: string;
          map_id: string;
          name: string;
          slug?: string;
          updated_at?: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          icon_emoji?: string;
          id?: string;
          map_id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tags_map_id_fkey";
            columns: ["map_id"];
            isOneToOne: false;
            referencedRelation: "maps";
            referencedColumns: ["id"];
          },
        ];
      };
      user_plugin_oauth_tokens: {
        Row: {
          access_token_ciphertext: string | null;
          access_token_expires_at: string | null;
          created_at: string;
          id: string;
          plugin_type_id: string;
          provider: string;
          refresh_token_ciphertext: string;
          revoked_at: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          access_token_ciphertext?: string | null;
          access_token_expires_at?: string | null;
          created_at?: string;
          id?: string;
          plugin_type_id: string;
          provider: string;
          refresh_token_ciphertext: string;
          revoked_at?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          access_token_ciphertext?: string | null;
          access_token_expires_at?: string | null;
          created_at?: string;
          id?: string;
          plugin_type_id?: string;
          provider?: string;
          refresh_token_ciphertext?: string;
          revoked_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_plugins: {
        Row: {
          config: Json;
          created_at: string;
          enabled: boolean;
          id: string;
          plugin_type_id: string;
          status: Database["public"]["Enums"]["plugin_link_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          config?: Json;
          created_at?: string;
          enabled?: boolean;
          id?: string;
          plugin_type_id: string;
          status?: Database["public"]["Enums"]["plugin_link_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          config?: Json;
          created_at?: string;
          enabled?: boolean;
          id?: string;
          plugin_type_id?: string;
          status?: Database["public"]["Enums"]["plugin_link_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_map_invitation: { Args: { p_token: string }; Returns: string };
      cancel_map_invitation: {
        Args: { p_invitation_id: string };
        Returns: undefined;
      };
      decline_map_invitation: { Args: { p_token: string }; Returns: undefined };
      invite_map_member: {
        Args: {
          p_invited_role: Database["public"]["Enums"]["map_member_role"];
          p_invitee_email: string;
          p_map_id: string;
        };
        Returns: string;
      };
      is_map_member: { Args: { p_map_id: string }; Returns: boolean };
      is_map_owner: { Args: { p_map_id: string }; Returns: boolean };
      map_claim_slug: {
        Args: { p_desired: string; p_map_id: string };
        Returns: string;
      };
      map_member_can_edit: { Args: { p_map_id: string }; Returns: boolean };
      mark_notification_read: {
        Args: { p_notification_id: string };
        Returns: undefined;
      };
      mark_notification_read_by_token: {
        Args: { p_invitation_token: string };
        Returns: undefined;
      };
      pin_claim_slug: {
        Args: { p_desired: string; p_map_id: string; p_pin_id: string };
        Returns: string;
      };
      pin_map_id: { Args: { p_pin_id: string }; Returns: string };
      register_push_token: {
        Args: {
          p_device_id?: string;
          p_platform: string;
          p_provider?: string;
          p_token: string;
        };
        Returns: undefined;
      };
      remove_map_member: {
        Args: { p_map_id: string; p_user_id: string };
        Returns: undefined;
      };
      slugify_text: { Args: { p_raw: string }; Returns: string };
      tag_claim_slug: {
        Args: { p_desired: string; p_map_id: string; p_tag_id: string };
        Returns: string;
      };
      transfer_map_ownership: {
        Args: { p_map_id: string; p_new_owner_user_id: string };
        Returns: undefined;
      };
      update_map_member_role: {
        Args: {
          p_map_id: string;
          p_role: Database["public"]["Enums"]["map_member_role"];
          p_user_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      map_invitation_status: "pending" | "accepted" | "declined" | "cancelled";
      map_member_role: "owner" | "editor" | "viewer";
      map_style: "auto" | "street" | "satellite";
      notification_type:
        | "map_invitation"
        | "map_invitation_accepted"
        | "map_ownership_received";
      plugin_link_status: "disabled" | "pending" | "error" | "connected";
      push_delivery_status: "pending" | "sent" | "failed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      map_invitation_status: ["pending", "accepted", "declined", "cancelled"],
      map_member_role: ["owner", "editor", "viewer"],
      map_style: ["auto", "street", "satellite"],
      notification_type: [
        "map_invitation",
        "map_invitation_accepted",
        "map_ownership_received",
      ],
      plugin_link_status: ["disabled", "pending", "error", "connected"],
      push_delivery_status: ["pending", "sent", "failed"],
    },
  },
} as const;
