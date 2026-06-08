import { isSingleEmoji } from "../heuristic.ts";
import type { LlmEmojiProvider } from "../types.ts";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

export type OpenAiEmojiProviderConfig = {
  apiKey: string;
  model?: string;
  baseUrl?: string;
};

export function createOpenAiEmojiProvider(
  config: OpenAiEmojiProviderConfig,
): LlmEmojiProvider {
  const apiKey = config.apiKey.trim();
  const model = config.model ?? "gpt-4o-mini";
  const baseUrl = (config.baseUrl ?? OPENAI_CHAT_URL).replace(/\/$/, "");

  return {
    suggestEmoji: async (name) => {
      const trimmed = name.trim();
      if (!trimmed) return null;

      try {
        const res = await fetch(baseUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            max_tokens: 8,
            messages: [
              {
                role: "system",
                content:
                  "Pick exactly one emoji that best represents the given map, tag, or list name. Reply with only the emoji character, nothing else.",
              },
              {
                role: "user",
                content: trimmed,
              },
            ],
          }),
        });

        if (!res.ok) return null;

        const body = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const text = body.choices?.[0]?.message?.content?.trim() ?? "";
        if (isSingleEmoji(text)) return text;
        const firstChar = [...text][0];
        return firstChar && isSingleEmoji(firstChar) ? firstChar : null;
      } catch {
        return null;
      }
    },
  };
}

export function createEmojiLlmProviderFromEnv(env: {
  EMOJI_LLM_API_KEY?: string;
  EMOJI_LLM_PROVIDER?: string;
  EMOJI_LLM_MODEL?: string;
  EMOJI_LLM_BASE_URL?: string;
}): LlmEmojiProvider | null {
  const apiKey = env.EMOJI_LLM_API_KEY?.trim();
  if (!apiKey) return null;

  const provider = (env.EMOJI_LLM_PROVIDER ?? "openai").toLowerCase();
  if (provider !== "openai") return null;

  return createOpenAiEmojiProvider({
    apiKey,
    model: env.EMOJI_LLM_MODEL,
    baseUrl: env.EMOJI_LLM_BASE_URL,
  });
}
