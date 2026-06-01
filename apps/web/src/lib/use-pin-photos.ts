import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Photo } from "@/types/database";

function photoIdsKey(photos: Photo[]) {
  return photos.map((p) => `${p.id}:${p.storage_path ?? ""}`).join("|");
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
    queryFn: async () => {
      const out: Record<string, string> = {};
      for (const p of photos) {
        if (!p.storage_path) continue;
        const { data, error } = await supabase.storage
          .from("pin-photos")
          .createSignedUrl(p.storage_path, 3600);
        if (!error && data?.signedUrl) out[p.id] = data.signedUrl;
      }
      return out;
    },
    enabled: Boolean(pinId) && photos.length > 0,
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
  const sortedIdsKey = useMemo(() => [...pinIds].sort().join(","), [pinIds]);

  const photosQuery = useQuery({
    queryKey: ["map-pin-photos", mapId, sortedIdsKey],
    queryFn: async () => {
      if (!mapId || pinIds.length === 0) return [];
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("map_id", mapId)
        .in("pin_id", pinIds)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Photo[];
    },
    enabled: Boolean(mapId) && pinIds.length > 0,
  });

  const photos = useMemo(() => photosQuery.data ?? [], [photosQuery.data]);
  const idsKey = photoIdsKey(photos);

  const signedUrlsQuery = useQuery({
    queryKey: ["photo-urls-batch", mapId, idsKey],
    queryFn: async () => {
      const out: Record<string, string> = {};
      for (const p of photos) {
        if (!p.storage_path) continue;
        const { data, error } = await supabase.storage
          .from("pin-photos")
          .createSignedUrl(p.storage_path, 3600);
        if (!error && data?.signedUrl) out[p.id] = data.signedUrl;
      }
      return out;
    },
    enabled: Boolean(mapId) && photos.length > 0,
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
