import { supabase } from "@/lib/supabase";
import type { Photo } from "@/types/database";

export const MAX_MAP_COVER_BYTES = 2 * 1024 * 1024;

const COVER_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

const COVER_EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

export function extFromCoverFile(file: File): string | null {
  return COVER_MIME_TO_EXT[file.type] ?? null;
}

export function extFromStoragePath(path: string): string | null {
  const match = path.trim().match(/\.([a-z0-9]+)$/i);
  if (!match) return null;
  const ext = match[1]!.toLowerCase();
  if (ext === "jpeg") return "jpg";
  return COVER_EXT_TO_MIME[ext] ? ext : null;
}

export function coverMimeForExt(ext: string): string {
  return COVER_EXT_TO_MIME[ext] ?? `image/${ext === "jpg" ? "jpeg" : ext}`;
}

export async function uploadMapCoverBlob(
  mapId: string,
  blob: Blob,
  ext: string,
): Promise<string> {
  if (blob.size > MAX_MAP_COVER_BYTES) {
    throw new Error("Image must be 2 MB or smaller.");
  }
  const path = `${mapId}/cover.${ext}`;
  const contentType = coverMimeForExt(ext);
  const { error: uploadError } = await supabase.storage
    .from("map-covers")
    .upload(path, blob, {
      upsert: true,
      contentType,
    });
  if (uploadError) throw uploadError;
  const { data: pub } = supabase.storage.from("map-covers").getPublicUrl(path);
  return pub.publicUrl;
}

export async function setMapCoverFromPinPhoto(
  mapId: string,
  photo: Pick<Photo, "id" | "storage_path">,
): Promise<string> {
  const storagePath = photo.storage_path?.trim();
  if (!storagePath) throw new Error("Photo file is missing.");

  const ext = extFromStoragePath(storagePath);
  if (!ext) throw new Error("Unsupported image format.");

  const { data, error: downloadError } = await supabase.storage
    .from("pin-photos")
    .download(storagePath);
  if (downloadError) throw downloadError;
  if (!data) throw new Error("Could not read photo.");

  const publicUrl = await uploadMapCoverBlob(mapId, data, ext);
  const { error: dbError } = await supabase
    .from("maps")
    .update({
      cover_url: publicUrl,
      cover_photo_id: photo.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mapId);
  if (dbError) throw dbError;
  return publicUrl;
}

export async function setMapCoverFromFile(
  mapId: string,
  file: File,
): Promise<string> {
  const ext = extFromCoverFile(file);
  if (!ext) {
    throw new Error("Please choose a JPEG, PNG, GIF, or WebP image.");
  }
  const publicUrl = await uploadMapCoverBlob(mapId, file, ext);
  const { error: dbError } = await supabase
    .from("maps")
    .update({
      cover_url: publicUrl,
      cover_photo_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mapId);
  if (dbError) throw dbError;
  return publicUrl;
}

export async function removeMapCover(mapId: string): Promise<void> {
  const { data: files } = await supabase.storage.from("map-covers").list(mapId);
  if (files?.length) {
    const paths = files.map((f) => `${mapId}/${f.name}`);
    await supabase.storage.from("map-covers").remove(paths);
  }
  const { error } = await supabase
    .from("maps")
    .update({
      cover_url: null,
      cover_photo_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mapId);
  if (error) throw error;
}
