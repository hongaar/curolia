/** Solid dimmed tag color for inactive timeline stops (no alpha). */
export function tripTimelineDimmedColor(color: string): string {
  return `color-mix(in oklch, ${color} 42%, var(--muted))`;
}

export function tripTimelineActiveRingColor(color: string): string {
  return `color-mix(in oklch, ${color} 28%, var(--card))`;
}
