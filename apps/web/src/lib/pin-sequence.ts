import type { PinWithTags } from "@/lib/pin-with-tags";
import type { PinSequenceNavItem } from "@curolia/ui/pin-sequence-nav";
import type { TripTimelineItem } from "@curolia/ui/trip-timeline";

export function pinsWithDates(pins: PinWithTags[]): PinWithTags[] {
  return pins.filter((pin) => Boolean(pin.date?.trim()));
}

/** Chronological travel order (oldest first). */
export function orderedPinTravelSequence(pins: PinWithTags[]): PinWithTags[] {
  const dated = pinsWithDates(pins);
  return [...dated].sort((a, b) => {
    const cmp = a.date!.localeCompare(b.date!);
    if (cmp !== 0) return cmp;
    return a.id.localeCompare(b.id);
  });
}

export function hasPinTravelSequence(pins: PinWithTags[]): boolean {
  return pinsWithDates(pins).length >= 2;
}

export function pinSequenceIndex(
  sequence: PinWithTags[],
  pinId: string,
): number {
  return sequence.findIndex((pin) => pin.id === pinId);
}

export function pinSequenceNeighbors(
  sequence: PinWithTags[],
  pinId: string,
): {
  index: number;
  previous: PinWithTags | null;
  next: PinWithTags | null;
} | null {
  const index = pinSequenceIndex(sequence, pinId);
  if (index < 0) return null;
  return {
    index,
    previous: index > 0 ? sequence[index - 1]! : null,
    next: index < sequence.length - 1 ? sequence[index + 1]! : null,
  };
}

export function pinSequenceTagColor(pin: PinWithTags): string | null {
  return pin.pin_tags?.[0]?.tags?.color ?? null;
}

export function pinSequenceDisplayTitle(pin: PinWithTags): string {
  return pin.title?.trim() || "Untitled place";
}

export function toPinSequenceNavItems(
  sequence: PinWithTags[],
): PinSequenceNavItem[] {
  return sequence.map((pin) => ({
    id: pin.id,
    title: pinSequenceDisplayTitle(pin),
    color: pinSequenceTagColor(pin),
  }));
}

export function toTripTimelineItems(
  sequence: PinWithTags[],
): TripTimelineItem[] {
  return sequence.map((pin) => ({
    id: pin.id,
    title: pinSequenceDisplayTitle(pin),
    color: pinSequenceTagColor(pin),
    date: pin.date!,
  }));
}
