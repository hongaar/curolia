import { supabase } from "@/lib/supabase";
import type { Photo } from "@/types/database";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";

function photoIdsKey(photos: Photo[]) {
  return photos.map((p) => `${p.id}:${p.storage_path ?? ""}`).join("|");
}

export function usePinPhotosSignedUrls(pinId: string | undefined) {
  const qc = useQueryClient();
  const photosQuery = useQuery({
    queryKey: ["photos", pinId],
    queryFn: async () => {
      if (!pinId) return [];
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("pin_id", pinId)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Photo[];
    },
    enabled: Boolean(pinId),
  });

  const photos = useMemo(() => photosQuery.data ?? [], [photosQuery.data]);
  const idsKey = photoIdsKey(photos);

  const signedUrlsQuery = useQuery({
    queryKey: ["photo-urls", pinId, idsKey],
    queryFn: async () => {
      const out: Record<string, string> = {};
      if (pinId) {
        for (const [, cached] of qc.getQueriesData<Record<string, string>>({
          queryKey: ["photo-urls", pinId],
        })) {
          if (cached) Object.assign(out, cached);
        }
      }

      const paths = photos
        .filter((p) => p.storage_path && !out[p.id])
        .map((p) => ({ id: p.id, path: p.storage_path! }));
      if (paths.length === 0) return out;

      const { data, error } = await supabase.storage
        .from("pin-photos")
        .createSignedUrls(
          paths.map((p) => p.path),
          3600,
        );
      if (error) {
        console.error("pin-photos createSignedUrls", error);
        return out;
      }
      for (let i = 0; i < paths.length; i++) {
        const row = data?.[i];
        if (row?.signedUrl && !row.error) out[paths[i]!.id] = row.signedUrl;
        else if (row?.error) console.error(paths[i]!.path, row.error);
      }
      return out;
    },
    placeholderData: keepPreviousData,
    // Wait until the photos list has settled so we don't sign URLs for a stale set
    // (e.g. while a long Google Photos import is invalidating/refetching photos).
    enabled: Boolean(pinId) && photos.length > 0 && !photosQuery.isFetching,
  });

  return {
    photos,
    signedUrlByPhotoId: signedUrlsQuery.data ?? {},
    isLoading:
      photosQuery.isLoading || (photos.length > 0 && signedUrlsQuery.isLoading),
  };
}

/** All photos on a map (e.g. cover picker), with signed URLs. */
export function useMapAllPhotosSignedUrls(mapId: string | undefined) {
  const qc = useQueryClient();

  const photosQuery = useQuery({
    queryKey: ["map-pin-photos", mapId],
    queryFn: async () => {
      if (!mapId) return [];
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("map_id", mapId)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Photo[];
    },
    enabled: Boolean(mapId),
  });

  const photos = useMemo(() => photosQuery.data ?? [], [photosQuery.data]);
  const idsKey = photoIdsKey(photos);

  const signedUrlsQuery = useQuery({
    queryKey: ["photo-urls-batch", mapId, idsKey],
    queryFn: async () => {
      const out: Record<string, string> = {};
      if (mapId) {
        for (const [, cached] of qc.getQueriesData<Record<string, string>>({
          queryKey: ["photo-urls-batch", mapId],
        })) {
          if (cached) Object.assign(out, cached);
        }
      }

      const paths = photos
        .filter((p) => p.storage_path && !out[p.id])
        .map((p) => ({ id: p.id, path: p.storage_path! }));
      if (paths.length === 0) return out;

      const { data, error } = await supabase.storage
        .from("pin-photos")
        .createSignedUrls(
          paths.map((p) => p.path),
          3600,
        );
      if (error) {
        console.error("pin-photos createSignedUrls", error);
        return out;
      }
      for (let i = 0; i < paths.length; i++) {
        const row = data?.[i];
        if (row?.signedUrl && !row.error) out[paths[i]!.id] = row.signedUrl;
        else if (row?.error) console.error(paths[i]!.path, row.error);
      }
      return out;
    },
    placeholderData: keepPreviousData,
    enabled: Boolean(mapId) && photos.length > 0 && !photosQuery.isFetching,
  });

  return {
    photos,
    signedUrlByPhotoId: signedUrlsQuery.data ?? {},
    isLoading:
      photosQuery.isLoading || (photos.length > 0 && signedUrlsQuery.isLoading),
  };
}

/** Photos for many pins at once (e.g. blog list), grouped by pin_id. */
export function useMapPinsPhotosSignedUrls(
  mapId: string | undefined,
  pinIds: string[],
) {
  const qc = useQueryClient();
  const pinIdSet = useMemo(() => new Set(pinIds), [pinIds]);

  const photosQuery = useQuery({
    queryKey: ["map-pin-photos", mapId],
    queryFn: async () => {
      if (!mapId) return [];
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("map_id", mapId)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Photo[];
    },
    enabled: Boolean(mapId) && pinIds.length > 0,
  });

  const photos = useMemo(() => {
    const all = photosQuery.data ?? [];
    if (pinIdSet.size === 0) return [];
    return all.filter((p) => pinIdSet.has(p.pin_id));
  }, [photosQuery.data, pinIdSet]);
  const idsKey = photoIdsKey(photos);

  const signedUrlsQuery = useQuery({
    queryKey: ["photo-urls-batch", mapId, idsKey],
    queryFn: async () => {
      const out: Record<string, string> = {};
      if (mapId) {
        for (const [, cached] of qc.getQueriesData<Record<string, string>>({
          queryKey: ["photo-urls-batch", mapId],
        })) {
          if (cached) Object.assign(out, cached);
        }
      }

      const paths = photos
        .filter((p) => p.storage_path && !out[p.id])
        .map((p) => ({ id: p.id, path: p.storage_path! }));
      if (paths.length === 0) return out;

      const { data, error } = await supabase.storage
        .from("pin-photos")
        .createSignedUrls(
          paths.map((p) => p.path),
          3600,
        );
      if (error) {
        console.error("pin-photos createSignedUrls", error);
        return out;
      }
      for (let i = 0; i < paths.length; i++) {
        const row = data?.[i];
        if (row?.signedUrl && !row.error) out[paths[i]!.id] = row.signedUrl;
        else if (row?.error) console.error(paths[i]!.path, row.error);
      }
      return out;
    },
    placeholderData: keepPreviousData,
    enabled: Boolean(mapId) && photos.length > 0 && !photosQuery.isFetching,
  });

  const photosByPinId = useMemo(() => {
    const m = new Map<string, Photo[]>();
    for (const p of photos) {
      const list = m.get(p.pin_id) ?? [];
      list.push(p);
      m.set(p.pin_id, list);
    }
    return m;
  }, [photos]);

  return {
    photosByPinId,
    signedUrlByPhotoId: signedUrlsQuery.data ?? {},
    isLoading:
      photosQuery.isLoading || (photos.length > 0 && signedUrlsQuery.isLoading),
  };
}
