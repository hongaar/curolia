import { supabase } from "@/lib/supabase";
import type { Photo } from "@/types/database";

export function reorderPhotosByIds(
  photos: Photo[],
  orderedIds: string[],
): Photo[] {
  const byId = new Map(photos.map((p) => [p.id, p]));
  return orderedIds.map((id, index) => {
    const photo = byId.get(id);
    if (!photo) throw new Error("photo_not_found");
    return { ...photo, sort_order: index };
  });
}

export async function persistPinPhotoOrder(
  orderedIds: string[],
): Promise<void> {
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("photos").update({ sort_order: index }).eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}
