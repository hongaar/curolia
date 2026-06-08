export type EmojiSuggestionSource = "heuristic" | "llm" | "default";

export type EmojiSuggestionConfidence = "high" | "medium" | "low";

export type EmojiSuggestion = {
  emoji: string;
  source: EmojiSuggestionSource;
  confidence: EmojiSuggestionConfidence;
};

export type SuggestEmojiOptions = {
  /** Fallback when nothing matches (e.g. "📍" for tags, "📔" for maps). */
  fallback?: string;
  /** Skip LLM even if configured. Default true when no provider is passed. */
  allowLlm?: boolean;
  /** Injected server-side only. */
  llmProvider?: LlmEmojiProvider;
};

export interface LlmEmojiProvider {
  suggestEmoji(name: string, candidates?: string[]): Promise<string | null>;
}

export const DEFAULT_TAG_EMOJI = "📍";
export const DEFAULT_MAP_EMOJI = "📔";
export const DEFAULT_LIST_EMOJI = "📋";
