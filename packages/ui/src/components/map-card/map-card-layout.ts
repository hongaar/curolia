/** Aspect ratios for emoji-only cards (width / height). */
const EMOJI_CARD_ASPECT_RATIOS: ReadonlyArray<{ w: number; h: number }> = [
  // portrait
  { w: 4, h: 5 },
  { w: 3, h: 4 },
  { w: 5, h: 6 },

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
