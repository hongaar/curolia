import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  PolarstepsImportJob,
  PolarstepsImportSource,
  PolarstepsSyncSummary,
  PolarstepsTripPreview,
} from "./config";

export type PolarstepsListTripsResponse = {
  trips: PolarstepsTripPreview[];
};

export type PolarstepsPreviewTripResponse = {
  trip: PolarstepsTripPreview;
};

export type PolarstepsImportResponse = {
  started: boolean;
  jobId: string;
  importJob: PolarstepsImportJob;
};

export type PolarstepsSyncStatusResponse = {
  lastSyncAt?: string;
  lastSyncSummary?: PolarstepsSyncSummary;
  importJob?: PolarstepsImportJob;
  importedTripIds?: string[];
  trips?: PolarstepsTripPreview[];
};

async function invoke<T>(
  supabase: SupabaseClient,
  body: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<
    T & { error?: string; message?: string }
  >("polarsteps", { body });
  if (error) throw error;
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(data.message ?? data.error);
  }
  return data as T;
}

export async function polarstepsListTrips(
  supabase: SupabaseClient,
): Promise<PolarstepsListTripsResponse> {
  return invoke(supabase, { action: "list_trips" });
}

export async function polarstepsPreviewTrip(
  supabase: SupabaseClient,
  shareUrl: string,
): Promise<PolarstepsPreviewTripResponse> {
  return invoke(supabase, { action: "preview_trip", shareUrl });
}

export async function polarstepsImport(
  supabase: SupabaseClient,
  mapId: string,
  sources: PolarstepsImportSource[],
): Promise<PolarstepsImportResponse> {
  return invoke(supabase, {
    action: "import",
    mapId,
    sources,
  });
}

export async function polarstepsSyncStatus(
  supabase: SupabaseClient,
  mapId: string,
): Promise<PolarstepsSyncStatusResponse> {
  return invoke(supabase, {
    action: "sync_status",
    mapId,
  });
}
