export {
  isSingleEmoji,
  normalizeName,
  suggestEmojiForName,
  suggestEmojiForNameSync,
  suggestEmojiHeuristic,
  tokenize,
} from "./heuristic.ts";
export { EMOJI_STOPWORDS, KEYWORD_EMOJI, PHRASE_EMOJI } from "./phrases.ts";
export {
  DEFAULT_LIST_EMOJI,
  DEFAULT_MAP_EMOJI,
  DEFAULT_TAG_EMOJI,
} from "./types.ts";
export type {
  EmojiSuggestion,
  EmojiSuggestionConfidence,
  EmojiSuggestionSource,
  LlmEmojiProvider,
  SuggestEmojiOptions,
} from "./types.ts";
