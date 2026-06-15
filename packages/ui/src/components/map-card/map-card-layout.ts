/** Aspect ratios for emoji-only cards (width / height). */
const EMOJI_CARD_ASPECT_RATIOS: ReadonlyArray<{ w: number; h: number }> = [
  // square
  { w: 1, h: 1 },

  // landscape
  { w: 5, h: 4 },
  { w: 6, h: 5 },
  { w: 4, h: 3 },
];

const MIN_COVER_ASPECT_RATIO = 0.62;
const MAX_COVER_ASPECT_RATIO = 1.55;

/** Stable string hash for deterministic layout picks. */
export function hashLayoutSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = Math.imul(31, hash) + seed.charCodeAt(i);
  }
  return Math.abs(hash);
}

/** Deterministic aspect ratio for cards without a cover photo. */
export function deterministicEmojiAspectRatio(seed: string): string {
  const index = hashLayoutSeed(seed) % EMOJI_CARD_ASPECT_RATIOS.length;
  const ratio = EMOJI_CARD_ASPECT_RATIOS[index] ?? EMOJI_CARD_ASPECT_RATIOS[0]!;
  return `${ratio.w} / ${ratio.h}`;
}

/** Clamp natural cover ratios so masonry stays balanced. */
export function normalizeCoverAspectRatio(
  width: number,
  height: number,
): number {
  if (width <= 0 || height <= 0) return 1;
  const ratio = width / height;
  return Math.min(
    MAX_COVER_ASPECT_RATIO,
    Math.max(MIN_COVER_ASPECT_RATIO, ratio),
  );
}

export function coverAspectRatioCss(ratio: number): string {
  return String(ratio);
}

/** Vibrant accent fills for the inset map icon on cover cards. */
const MAP_CARD_ACCENT_COLORS: readonly string[] = [
  "oklch(0.58 0.22 280)",
  "oklch(0.65 0.2 45)",
  "oklch(0.58 0.18 145)",
  "oklch(0.55 0.2 250)",
  "oklch(0.62 0.22 340)",
  "oklch(0.6 0.18 200)",
];

/** Deterministic accent color for the inset icon badge. */
export function deterministicAccentColor(seed: string): string {
  const index = hashLayoutSeed(seed) % MAP_CARD_ACCENT_COLORS.length;
  return MAP_CARD_ACCENT_COLORS[index] ?? MAP_CARD_ACCENT_COLORS[0]!;
}
