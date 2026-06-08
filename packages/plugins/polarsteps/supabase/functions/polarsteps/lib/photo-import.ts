import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { PLUGIN_TYPE_ID } from "./import-steps.ts";
import type { ParsedPolarstepsPhoto } from "./parse-trip.ts";

function extFromMime(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
}

function isStorageUploadRetryable(err: {
  message?: string;
  statusCode?: string;
}): boolean {
  const code = err.statusCode ?? "";
  if (code === "504" || code === "503" || code === "500") return true;
  const msg = err.message?.toLowerCase() ?? "";
  return msg.includes("timeout") || msg.includes("timed out");
}

async function uploadPinPhoto(
  admin: SupabaseClient,
  path: string,
  buf: Uint8Array,
  mime: string,
): Promise<{ ok: true } | { ok: false; error: unknown }> {
  const body = new Blob([buf], { type: mime });
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error: upErr } = await admin.storage
      .from("pin-photos")
      .upload(path, body, {
        contentType: mime,
        upsert: false,
      });
    if (!upErr) return { ok: true };
    if (!isStorageUploadRetryable(upErr) || attempt === 2) {
      return { ok: false, error: upErr };
    }
    await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
  }
  return { ok: false, error: new Error("upload_retries_exhausted") };
}

async function loadExistingMediaIds(
  admin: SupabaseClient,
  pinId: string,
): Promise<Set<string>> {
  const { data, error } = await admin
    .from("photos")
    .select("external_ref")
    .eq("pin_id", pinId)
    .eq("source_plugin_id", PLUGIN_TYPE_ID);

  if (error) {
    console.error("loadExistingMediaIds failed", error);
    return new Set();
  }

  const ids = new Set<string>();
  for (const row of data ?? []) {
    const ref = row.external_ref as Record<string, unknown> | null;
    const mediaId = ref?.mediaId;
    if (typeof mediaId === "string") ids.add(mediaId);
  }
  return ids;
}

export type PhotoImportResult = {
  imported: number;
  failed: number;
};

export async function importStepPhotos(
  admin: SupabaseClient,
  mapId: string,
  pinId: string,
  photos: ParsedPolarstepsPhoto[],
): Promise<PhotoImportResult> {
  if (photos.length === 0) return { imported: 0, failed: 0 };

  const existingMediaIds = await loadExistingMediaIds(admin, pinId);

  const { data: maxRow } = await admin
    .from("photos")
    .select("sort_order")
    .eq("pin_id", pinId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  let sort = Number(maxRow?.sort_order ?? -1) + 1;
  let imported = 0;
  let failed = 0;

  for (const photo of photos) {
    if (existingMediaIds.has(photo.mediaId)) continue;

    let buf: Uint8Array | null = null;
    let mime = "image/jpeg";
    try {
      const res = await fetch(photo.url);
      if (!res.ok) {
        failed += 1;
        continue;
      }
      mime = res.headers.get("content-type")?.split(";")[0]?.trim() || mime;
      if (mime.startsWith("video/")) {
        failed += 1;
        continue;
      }
      buf = new Uint8Array(await res.arrayBuffer());
    } catch (e) {
      console.error("photo download failed", photo.mediaId, e);
      failed += 1;
      continue;
    }

    const ext = extFromMime(mime);
    const path = `${mapId}/${pinId}/ps-${photo.mediaId}.${ext}`;
    const external_ref = {
      kind: "polarsteps",
      mediaId: photo.mediaId,
      uuid: photo.uuid,
    };

    const upload = await uploadPinPhoto(admin, path, buf, mime);
    if (!upload.ok) {
      const upErr = upload.error as {
        message?: string;
        statusCode?: string;
      };
      const duplicate =
        upErr.message?.toLowerCase().includes("already exists") ||
        upErr.statusCode === "409";
      if (duplicate && existingMediaIds.has(photo.mediaId)) {
        continue;
      }
      console.error("photo upload failed", photo.mediaId, upErr);
      failed += 1;
      continue;
    }

    const { error: insErr } = await admin.from("photos").insert({
      map_id: mapId,
      pin_id: pinId,
      storage_path: path,
      sort_order: sort,
      source_plugin_id: PLUGIN_TYPE_ID,
      external_ref,
      ...(photo.width && photo.height
        ? { width: photo.width, height: photo.height }
        : {}),
    });

    if (insErr) {
      console.error("photos insert failed", photo.mediaId, insErr);
      failed += 1;
      continue;
    }

    existingMediaIds.add(photo.mediaId);
    sort += 1;
    imported += 1;
  }

  return { imported, failed };
}
