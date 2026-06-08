import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

const PLUGIN_TYPE_ID = "polarsteps";

export type CachedTripPreview = {
  tripId: string;
  shareUrl: string;
  title: string;
  stepCount: number;
  photoCount?: number;
  startDate?: string;
  endDate?: string;
  addedAt: string;
};

export type UserPolarstepsPluginData = {
  trips?: Record<string, CachedTripPreview>;
};

export async function loadUserPolarstepsData(
  admin: SupabaseClient,
  userId: string,
): Promise<UserPolarstepsPluginData> {
  const { data, error } = await admin
    .from("plugin_entity_data")
    .select("data")
    .eq("entity_type", "user")
    .eq("entity_id", userId)
    .eq("plugin_type_id", PLUGIN_TYPE_ID)
    .maybeSingle();

  if (error) {
    console.error("loadUserPolarstepsData failed", error);
    return {};
  }

  return (data?.data ?? {}) as UserPolarstepsPluginData;
}

export async function patchUserPolarstepsData(
  admin: SupabaseClient,
  userId: string,
  patch: Partial<UserPolarstepsPluginData>,
): Promise<void> {
  const prev = await loadUserPolarstepsData(admin, userId);
  const next: UserPolarstepsPluginData = { ...prev, ...patch };

  if (patch.trips) {
    next.trips = { ...prev.trips, ...patch.trips };
  }

  const { error } = await admin.from("plugin_entity_data").upsert(
    {
      map_id: null,
      entity_type: "user",
      entity_id: userId,
      plugin_type_id: PLUGIN_TYPE_ID,
      data: next,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "entity_type,entity_id,plugin_type_id" },
  );

  if (error) console.error("patchUserPolarstepsData failed", error);
}

export function listCachedTrips(
  data: UserPolarstepsPluginData,
): CachedTripPreview[] {
  const trips = data.trips ?? {};
  return Object.values(trips).sort((a, b) =>
    b.addedAt.localeCompare(a.addedAt),
  );
}
