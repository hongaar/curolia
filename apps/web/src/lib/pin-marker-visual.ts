import type { PinWithTags } from "@/lib/pin-with-tags";

/**
 * Visual inputs for a pin's map marker.
 * - `photoUrl` set → large circular photo marker
 * - tag with emoji → medium emoji marker
 * - tag without emoji → small solid tag-color marker
 * - no tag → small default marker
 */
export type PinMarkerVisual = {
  emoji: string | null;
  fill: string | null;
  photoUrl: string | null;
};

export function pinMarkerVisual(
  pin: PinWithTags,
  photoUrl?: string | null,
): PinMarkerVisual {
  const tag0 = pin.pin_tags?.[0]?.tags;
  return {
    emoji: tag0?.icon_emoji?.trim() || null,
    fill: tag0?.color ?? null,
    photoUrl: photoUrl?.trim() || null,
  };
}
