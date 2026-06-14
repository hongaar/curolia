import type { Photo, Pin } from "@/types/database";

export type PinWithTags = Pin & {
  pin_tags?: {
    tag_id: string;
    tags: {
      id: string;
      name: string;
      color: string;
      icon_emoji: string | null;
    } | null;
  }[];
  photos?: Pick<Photo, "id" | "storage_path" | "sort_order">[] | null;
};

export function filterPinsByTags(
  pins: PinWithTags[],
  selectedTagIds: Set<string>,
) {
  return pins.filter((t) => {
    if (selectedTagIds.size === 0) return true;
    const tagIds = new Set(
      (t.pin_tags ?? [])
        .map((tt) => tt.tags?.id)
        .filter((id): id is string => Boolean(id)),
    );
    for (const id of selectedTagIds) {
      if (tagIds.has(id)) return true;
    }
    return false;
  });
}
