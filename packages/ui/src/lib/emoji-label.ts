type FrimousseCache = {
  data?: {
    emojis?: Array<{
      emoji: string;
      label: string;
      skins?: Record<string, string>;
    }>;
  };
};

const FRIMOUSSE_CACHE_KEY = "frimousse/data/en";
const EMOJIBASE_URL =
  "https://cdn.jsdelivr.net/npm/emojibase-data@latest/en/data.json";

const labelByEmoji = new Map<string, string>();
let loadPromise: Promise<void> | null = null;

function capitalizeLabel(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function registerEmoji(
  emoji: string,
  label: string,
  skins?: Record<string, string>,
) {
  const normalized = capitalizeLabel(label);
  labelByEmoji.set(emoji, normalized);
  if (skins) {
    for (const skinEmoji of Object.values(skins)) {
      labelByEmoji.set(skinEmoji, normalized);
    }
  }
}

function populateFromCache(cache: FrimousseCache) {
  for (const entry of cache.data?.emojis ?? []) {
    registerEmoji(entry.emoji, entry.label, entry.skins);
  }
}

function readFrimousseCache(): boolean {
  try {
    const raw = localStorage.getItem(FRIMOUSSE_CACHE_KEY);
    if (!raw) return false;
    populateFromCache(JSON.parse(raw) as FrimousseCache);
    return labelByEmoji.size > 0;
  } catch {
    return false;
  }
}

async function fetchEmojibaseData() {
  const response = await fetch(EMOJIBASE_URL);
  if (!response.ok) {
    throw new Error(`Failed to load emoji data (${response.status})`);
  }

  const emojis = (await response.json()) as Array<{
    emoji?: string;
    label?: string;
    skins?: Array<{ emoji: string }>;
  }>;

  for (const entry of emojis) {
    if (!entry.emoji || !entry.label) continue;
    const skins = entry.skins?.reduce<Record<string, string>>(
      (acc, skin, index) => {
        acc[String(index)] = skin.emoji;
        return acc;
      },
      {},
    );
    registerEmoji(entry.emoji, entry.label, skins);
  }
}

export function getEmojiLabel(emoji: string): string | undefined {
  return labelByEmoji.get(emoji);
}

export function loadEmojiLabels(): Promise<void> {
  if (labelByEmoji.size > 0) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    if (!readFrimousseCache()) {
      await fetchEmojibaseData();
    }
  })();

  return loadPromise;
}
