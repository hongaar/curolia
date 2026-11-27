import {
  externalPhotoDisplayUrl,
  mergePhotoDisplayUrls,
  photoIdsKey,
} from "@/lib/photo-display-url";
import { supabase } from "@/lib/supabase";
import type { Photo } from "@/types/database";
import { signPinPhotoPaths } from "@curolia/plugin-contract";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

/** Display URLs by photo id: cached signed URLs for stored photos, else external URLs. */
async function signedUrlsForPhotos(
  photos: Photo[],
): Promise<Record<string, string>> {
  const signed = await signPinPhotoPaths(
    supabase,
    photos.flatMap((p) => (p.storage_path ? [p.storage_path] : [])),
  );
  const out: Record<string, string> = {};
  for (const photo of photos) {
    const url =
      (photo.storage_path && signed[photo.storage_path]) ||
      externalPhotoDisplayUrl(photo.external_ref);
    if (url) out[photo.id] = url;
  }
  return out;
}

export function usePinPhotosSignedUrls(pinId: string | undefined) {
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
    queryFn: () => signedUrlsForPhotos(photos),
    placeholderData: keepPreviousData,
    // Wait until the photos list has settled so we don't sign URLs for a stale set
    // (e.g. while a long Google Photos import is invalidating/refetching photos).
    enabled: Boolean(pinId) && photos.length > 0 && !photosQuery.isFetching,
  });

  return {
    photos,
    signedUrlByPhotoId: mergePhotoDisplayUrls(
      photos,
      signedUrlsQuery.data ?? {},
    ),
    isLoading:
      photosQuery.isLoading || (photos.length > 0 && signedUrlsQuery.isLoading),
  };
}

/** All photos on a map (e.g. cover picker), with signed URLs. */
export function useMapAllPhotosSignedUrls(mapId: string | undefined) {
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
    queryFn: () => signedUrlsForPhotos(photos),
    placeholderData: keepPreviousData,
    enabled: Boolean(mapId) && photos.length > 0 && !photosQuery.isFetching,
  });

  return {
    photos,
    signedUrlByPhotoId: mergePhotoDisplayUrls(
      photos,
      signedUrlsQuery.data ?? {},
    ),
    isLoading:
      photosQuery.isLoading || (photos.length > 0 && signedUrlsQuery.isLoading),
  };
}

/** Photos for many pins at once (e.g. blog list), grouped by pin_id. */
export function useMapPinsPhotosSignedUrls(
  mapId: string | undefined,
  pinIds: string[],
) {
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
    queryFn: () => signedUrlsForPhotos(photos),
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
    signedUrlByPhotoId: mergePhotoDisplayUrls(
      photos,
      signedUrlsQuery.data ?? {},
    ),
    isLoading:
      photosQuery.isLoading || (photos.length > 0 && signedUrlsQuery.isLoading),
  };
}
