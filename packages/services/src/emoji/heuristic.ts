import { EMOJI_STOPWORDS, KEYWORD_EMOJI, PHRASE_EMOJI } from "./phrases.ts";
import type {
  EmojiSuggestion,
  EmojiSuggestionConfidence,
  SuggestEmojiOptions,
} from "./types.ts";
import { DEFAULT_LIST_EMOJI } from "./types.ts";

const EMOJIBASE_URL =
  "https://cdn.jsdelivr.net/npm/emojibase-data@latest/en/data.json";

type EmojibaseEntry = {
  emoji?: string;
  annotation?: string;
  tags?: string[];
  shortcodes?: string[];
};

let emojibaseIndexPromise: Promise<Map<string, string>> | null = null;

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s\-_/&]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(name: string): string[] {
  const normalized = normalizeName(name);
  if (!normalized) return [];
  return normalized
    .split(/[\s\-_/&]+|(?:\band\b)/g)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !EMOJI_STOPWORDS.has(t));
}

function isSingleEmoji(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^\p{Extended_Pictographic}$/u.test(trimmed);
}

function scoreToConfidence(score: number): EmojiSuggestionConfidence {
  if (score >= 3) return "high";
  if (score >= 2) return "medium";
  return "low";
}

function matchExactPhrase(normalized: string): EmojiSuggestion | null {
  if (PHRASE_EMOJI[normalized]) {
    return {
      emoji: PHRASE_EMOJI[normalized]!,
      source: "heuristic",
      confidence: "high",
    };
  }
  return null;
}

function scoreTokens(tokens: string[]): {
  emoji: string;
  score: number;
} | null {
  const scores = new Map<string, number>();

  for (const token of tokens) {
    const direct = KEYWORD_EMOJI[token];
    if (direct) {
      scores.set(direct, (scores.get(direct) ?? 0) + 3);
    }
  }

  if (scores.size === 0) return null;

  let bestEmoji = "";
  let bestScore = 0;
  for (const [emoji, score] of scores) {
    if (score > bestScore) {
      bestScore = score;
      bestEmoji = emoji;
    }
  }

  const hitCount = [...scores.values()].filter((s) => s >= 3).length;
  if (hitCount >= 2) bestScore += 1;

  return { emoji: bestEmoji, score: bestScore };
}

async function loadEmojibaseIndex(): Promise<Map<string, string>> {
  if (emojibaseIndexPromise) return emojibaseIndexPromise;

  emojibaseIndexPromise = (async () => {
    const index = new Map<string, string>();
    try {
      const res = await fetch(EMOJIBASE_URL);
      if (!res.ok) return index;
      const entries = (await res.json()) as EmojibaseEntry[];
      for (const entry of entries) {
        if (!entry.emoji) continue;
        const terms = [
          ...(entry.tags ?? []),
          ...(entry.shortcodes ?? []).map((s) => s.replace(/_/g, " ")),
          entry.annotation,
        ].filter(Boolean) as string[];
        for (const term of terms) {
          for (const word of term.toLowerCase().split(/\s+/)) {
            if (word.length < 3 || EMOJI_STOPWORDS.has(word)) continue;
            if (!index.has(word)) index.set(word, entry.emoji!);
          }
        }
      }
    } catch {
      /* use built-in keywords only */
    }
    return index;
  })();

  return emojibaseIndexPromise;
}

function scoreWithEmojibaseIndex(
  tokens: string[],
  index: Map<string, string>,
): { emoji: string; score: number } | null {
  const scores = new Map<string, number>();

  for (const token of tokens) {
    const fromKeyword = KEYWORD_EMOJI[token];
    if (fromKeyword) {
      scores.set(fromKeyword, (scores.get(fromKeyword) ?? 0) + 3);
      continue;
    }
    const fromEmojibase = index.get(token);
    if (fromEmojibase) {
      scores.set(fromEmojibase, (scores.get(fromEmojibase) ?? 0) + 2);
    }
  }

  if (scores.size === 0) return null;

  let bestEmoji = "";
  let bestScore = 0;
  for (const [emoji, score] of scores) {
    if (score > bestScore) {
      bestScore = score;
      bestEmoji = emoji;
    }
  }

  const distinctHits = scores.size;
  if (distinctHits >= 2 && bestScore >= 4) bestScore += 1;

  return { emoji: bestEmoji, score: bestScore };
}

function fallbackSuggestion(fallback: string): EmojiSuggestion {
  return { emoji: fallback, source: "default", confidence: "low" };
}

/** Heuristic-only emoji suggestion (no network, safe for Edge). */
export function suggestEmojiHeuristic(
  name: string,
  options?: Pick<SuggestEmojiOptions, "fallback">,
): EmojiSuggestion {
  const fallback = options?.fallback ?? DEFAULT_LIST_EMOJI;
  const trimmed = name.trim();
  if (!trimmed) return fallbackSuggestion(fallback);

  const normalized = normalizeName(trimmed);
  const exact = matchExactPhrase(normalized);
  if (exact) return exact;

  const tokens = tokenize(trimmed);
  const scored = scoreTokens(tokens);
  if (scored && scored.score >= 2) {
    return {
      emoji: scored.emoji,
      source: "heuristic",
      confidence: scoreToConfidence(scored.score),
    };
  }

  return fallbackSuggestion(fallback);
}

/** Sync wrapper — heuristics only. */
export function suggestEmojiForNameSync(
  name: string,
  options?: Pick<SuggestEmojiOptions, "fallback">,
): EmojiSuggestion {
  return suggestEmojiHeuristic(name, options);
}

/** Async suggestion: heuristics first, optional emojibase enrichment, then LLM. */
export async function suggestEmojiForName(
  name: string,
  options?: SuggestEmojiOptions,
): Promise<EmojiSuggestion> {
  const fallback = options?.fallback ?? DEFAULT_LIST_EMOJI;
  const trimmed = name.trim();
  if (!trimmed) return fallbackSuggestion(fallback);

  const normalized = normalizeName(trimmed);
  const exact = matchExactPhrase(normalized);
  if (exact) return exact;

  const tokens = tokenize(trimmed);

  const index = await loadEmojibaseIndex();
  const enriched = scoreWithEmojibaseIndex(tokens, index);
  if (enriched && enriched.score >= 2) {
    return {
      emoji: enriched.emoji,
      source: "heuristic",
      confidence: scoreToConfidence(enriched.score),
    };
  }

  const basic = scoreTokens(tokens);
  if (basic && basic.score >= 2) {
    return {
      emoji: basic.emoji,
      source: "heuristic",
      confidence: scoreToConfidence(basic.score),
    };
  }

  const allowLlm = options?.allowLlm === true && options.llmProvider;
  if (allowLlm) {
    const fromLlm = await options.llmProvider!.suggestEmoji(trimmed);
    if (fromLlm && isSingleEmoji(fromLlm)) {
      return { emoji: fromLlm, source: "llm", confidence: "medium" };
    }
  }

  return fallbackSuggestion(fallback);
}

export { isSingleEmoji, normalizeName, tokenize };
