/**
 * Softens a tag color while keeping its hue readable on `--card` surfaces.
 * Uses card (not muted) so light tag colors stay distinguishable from each other.
 */
export function tripTimelineSoftColor(
  color: string,
  colorSharePercent: number,
): string {
  return `color-mix(in oklch, ${color} ${colorSharePercent}%, var(--card))`;
}

/** Inactive timeline stops: muted tag tint, still recognizable. */
export function tripTimelineDimmedColor(color: string): string {
  return tripTimelineSoftColor(color, 55);
}

/** Active stop focus ring: softer than the filled dot. */
export function tripTimelineActiveRingColor(color: string): string {
  return tripTimelineSoftColor(color, 40);
}
