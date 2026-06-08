import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  GoogleMapsImportJob,
  GoogleMapsListDiscoveryJob,
  GoogleMapsSavedListSource,
  GoogleMapsSavedListsSyncSummary,
} from "./config";

export type GoogleMapsCollectionSource = {
  id: string;
  name: string;
  itemCount: number;
};

export type GoogleMapsListSourcesResponse = {
  starred: boolean;
  starredCount?: number;
  collections: GoogleMapsCollectionSource[];
  lastExportAt?: string;
  accessType?: string;
  hasExportCache?: boolean;
  listCount?: number;
  started?: boolean;
  listDiscoveryJob?: GoogleMapsListDiscoveryJob;
};

export type GoogleMapsImportResponse = {
  started: boolean;
  jobId: string;
  importJob: GoogleMapsImportJob;
};

export type GoogleMapsSyncStatusResponse = {
  linked: boolean;
  hasExportCache?: boolean;
  listCount?: number;
  lastExportAt?: string;
  accessType?: string;
  listDiscoveryJob?: GoogleMapsListDiscoveryJob;
  lastSyncAt?: string;
  lastSyncSummary?: GoogleMapsSavedListsSyncSummary;
  importJob?: GoogleMapsImportJob;
};

async function invoke<T>(
  supabase: SupabaseClient,
  body: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<
    T & { error?: string; message?: string }
  >("google-maps-saved-lists", { body });
  if (error) throw error;
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(data.message ?? data.error);
  }
  return data as T;
}

export async function googleMapsSavedListsListSources(
  supabase: SupabaseClient,
): Promise<GoogleMapsListSourcesResponse> {
  return invoke(supabase, { action: "list_sources" });
}

export async function googleMapsSavedListsStartDownload(
  supabase: SupabaseClient,
): Promise<GoogleMapsListSourcesResponse> {
  return invoke(supabase, { action: "start_download" });
}

export async function googleMapsSavedListsImport(
  supabase: SupabaseClient,
  mapId: string,
  sources: GoogleMapsSavedListSource[],
): Promise<GoogleMapsImportResponse> {
  return invoke(supabase, {
    action: "import",
    mapId,
    sources,
  });
}

export async function googleMapsSavedListsSyncStatus(
  supabase: SupabaseClient,
  mapId: string,
): Promise<GoogleMapsSyncStatusResponse> {
  return invoke(supabase, {
    action: "sync_status",
    mapId,
  });
}
