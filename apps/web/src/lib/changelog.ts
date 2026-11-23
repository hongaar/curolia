import type { Database } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

export type ChangelogEntry =
  Database["public"]["Tables"]["changelog_entries"]["Row"];

export type ChangelogEntryInput = {
  published_on: string;
  description: string;
  image_url: string | null;
};

export const CHANGELOG_QUERY_KEY = ["changelog_entries"] as const;
export const IS_APP_ADMIN_QUERY_KEY = ["is_app_admin"] as const;

const CHANGELOG_BUCKET = "changelog";
const MAX_CHANGELOG_IMAGE_BYTES = 5 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

export async function fetchChangelogEntries(
  limit = 5,
): Promise<ChangelogEntry[]> {
  const { data, error } = await supabase
    .from("changelog_entries")
    .select("*")
    .order("published_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchIsAppAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_app_admin");
  if (error) throw error;
  return data === true;
}

export async function saveChangelogEntry(
  id: string | null,
  input: ChangelogEntryInput,
): Promise<void> {
  const { error } = id
    ? await supabase
        .from("changelog_entries")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
    : await supabase.from("changelog_entries").insert(input);
  if (error) throw error;
}

export async function deleteChangelogEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from("changelog_entries")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

/** Uploads an image to the public changelog bucket and returns its public URL. */
export async function uploadChangelogImage(file: File): Promise<string> {
  const ext = MIME_TO_EXT[file.type];
  if (!ext) throw new Error("Please choose a JPEG, PNG, GIF, or WebP image.");
  if (file.size > MAX_CHANGELOG_IMAGE_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(CHANGELOG_BUCKET)
    .upload(path, file, { contentType: file.type });
  if (error) throw error;
  return supabase.storage.from(CHANGELOG_BUCKET).getPublicUrl(path).data
    .publicUrl;
}

export function formatChangelogDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
