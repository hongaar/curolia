/** Quick-pick positive reactions shown on every pin. */
export const QUICK_REACTION_EMOJIS = [
  "👍",
  "❤️",
  "😊",
  "🎉",
  "🔥",
  "👏",
  "✨",
  "🙌",
] as const;

const EMOJI_PRESENTATION = "\uFE0F";

/** Code points that render as text unless followed by U+FE0F. */
const TEXT_DEFAULT_PRESENTATION = new Set([
  0x2764, // heavy black heart
  0x2665, // black heart suit
  0x2661, // white heart suit
  0x2615, // hot beverage
  0x26bd, // soccer ball
  0x26be, // baseball
]);

function firstGrapheme(text: string): string {
  if (!text) return "";
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });
    return [...segmenter.segment(text)][0]?.segment ?? "";
  }
  if (text.length >= 2 && text.charCodeAt(1) === 0xfe0f) {
    return text.slice(0, 2);
  }
  return text.slice(0, 1);
}

function ensureEmojiPresentation(grapheme: string): string {
  if (!grapheme || grapheme.includes(EMOJI_PRESENTATION)) {
    return grapheme;
  }
  const cp = grapheme.codePointAt(0);
  if (
    cp != null &&
    TEXT_DEFAULT_PRESENTATION.has(cp) &&
    grapheme.length === 1
  ) {
    return grapheme + EMOJI_PRESENTATION;
  }
  return grapheme;
}

/** Canonical emoji for storage, grouping, and display (preserves VS-16). */
export function normalizeReactionEmoji(raw: string): string {
  const grapheme = firstGrapheme(raw.trim());
  if (!grapheme) return "";
  return ensureEmojiPresentation(grapheme);
}
