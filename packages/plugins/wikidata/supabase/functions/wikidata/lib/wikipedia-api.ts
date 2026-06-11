import { AsyncLruCache } from "./_services/lru-cache.ts";

const USER_AGENT =
  "Curolia/1.0 (https://github.com/curolia/curolia; plugin-wikidata)";

export type WikiSummary = {
  title: string;
  extract: string;
  thumbnailUrl: string | null;
  wikipediaUrl: string;
  lang: string;
};

export type SearchHit = {
  wikidataId: string;
  label: string;
  wikipediaTitle: string;
  wikipediaLang: string;
  thumbnailUrl: string | null;
  snippet: string | null;
};

export type SearchGroup = {
  lang: string;
  label: string;
  results: SearchHit[];
};

const WIKIPEDIA_SUMMARY_CACHE_SIZE = 256;
const WIKIPEDIA_SEARCH_CACHE_SIZE = 64;

const wikipediaSummaryCache = new AsyncLruCache<string, WikiSummary | null>({
  maxSize: WIKIPEDIA_SUMMARY_CACHE_SIZE,
});
const wikipediaSearchCache = new AsyncLruCache<string, SearchGroup[]>({
  maxSize: WIKIPEDIA_SEARCH_CACHE_SIZE,
});

function wikipediaApiBase(lang: string): string {
  return `https://${lang}.wikipedia.org/w/api.php`;
}

function wikipediaSummaryBase(lang: string): string {
  return `https://${lang}.wikipedia.org/api/rest_v1/page/summary/`;
}

function wikipediaTitleCacheKey(title: string): string {
  return title.trim().replace(/\s+/g, "_").toLowerCase();
}

function stripHtmlSnippet(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchWikipediaSummary(
  lang: string,
  title: string,
): Promise<WikiSummary | null> {
  const cacheKey = `wiki:summary:${lang}:${wikipediaTitleCacheKey(title)}`;
  return wikipediaSummaryCache.getOrFetch(cacheKey, () =>
    fetchWikipediaSummaryUncached(lang, title),
  );
}

async function fetchWikipediaSummaryUncached(
  lang: string,
  title: string,
): Promise<WikiSummary | null> {
  const encoded = encodeURIComponent(title.replace(/ /g, "_"));
  const res = await fetch(`${wikipediaSummaryBase(lang)}${encoded}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`wikipedia_summary_${lang}_${res.status}`);
  }
  const json = (await res.json()) as Record<string, unknown>;
  const extract = typeof json.extract === "string" ? json.extract.trim() : "";
  const resolvedTitle =
    typeof json.title === "string" ? json.title.trim() : title;
  const thumb = json.thumbnail as { source?: string } | undefined;
  const urls = json.content_urls as { desktop?: { page?: string } } | undefined;
  const pageUrl = urls?.desktop?.page?.trim();
  if (!extract || !pageUrl) return null;

  return {
    title: resolvedTitle,
    extract,
    thumbnailUrl: typeof thumb?.source === "string" ? thumb.source : null,
    wikipediaUrl: pageUrl,
    lang,
  };
}

export async function fetchWikipediaThumbnail(
  lang: string,
  title: string,
): Promise<string | null> {
  const summary = await fetchWikipediaSummary(lang, title);
  return summary?.thumbnailUrl ?? null;
}

async function searchWikipediaLangUncached(
  lang: string,
  query: string,
  limit: number,
  resolveWikidataIdsForTitles: (
    lang: string,
    titles: string[],
  ) => Promise<Map<string, string>>,
): Promise<SearchHit[]> {
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: query,
    srlimit: String(limit),
    format: "json",
    origin: "*",
  });
  const res = await fetch(`${wikipediaApiBase(lang)}?${params}`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`wikipedia_search_${lang}_${res.status}`);
  }

  const json = (await res.json()) as {
    query?: {
      search?: Array<{ title?: string; snippet?: string }>;
    };
  };
  const rows = json.query?.search ?? [];
  const titles = rows
    .map((row) => row.title?.trim())
    .filter((title): title is string => Boolean(title));
  if (titles.length === 0) return [];

  const wikidataByTitle = await resolveWikidataIdsForTitles(lang, titles);
  const hits: SearchHit[] = [];

  for (const row of rows) {
    const title = row.title?.trim();
    if (!title) continue;
    const wikidataId = wikidataByTitle.get(title);
    if (!wikidataId) continue;
    hits.push({
      wikidataId,
      label: title,
      wikipediaTitle: title,
      wikipediaLang: lang,
      thumbnailUrl: null,
      snippet: row.snippet ? stripHtmlSnippet(row.snippet) : null,
    });
  }

  return hits;
}

export async function searchWikipediaArticles(
  query: string,
  langPrefs: string[],
  limitPerLang: number,
  resolveWikidataIdsForTitles: (
    lang: string,
    titles: string[],
  ) => Promise<Map<string, string>>,
  groupLabel: (lang: string) => string,
): Promise<SearchGroup[]> {
  const cacheKey = `wiki:search:${langPrefs.join(",")}:${query.trim().toLowerCase()}`;
  return wikipediaSearchCache.getOrFetch(cacheKey, async () => {
    const seenIds = new Set<string>();
    const groups: SearchGroup[] = [];

    for (const lang of langPrefs) {
      const raw = await searchWikipediaLangUncached(
        lang,
        query,
        limitPerLang,
        resolveWikidataIdsForTitles,
      );
      const results: SearchHit[] = [];
      for (const hit of raw) {
        if (seenIds.has(hit.wikidataId)) continue;
        seenIds.add(hit.wikidataId);
        results.push(hit);
      }
      if (results.length === 0) continue;

      const enriched = await Promise.all(
        results.map(async (hit) => {
          try {
            const thumbnailUrl = await fetchWikipediaThumbnail(
              hit.wikipediaLang,
              hit.wikipediaTitle,
            );
            return { ...hit, thumbnailUrl };
          } catch (e) {
            console.error(
              "wikipedia thumbnail failed",
              hit.wikipediaLang,
              hit.wikipediaTitle,
              e,
            );
            return hit;
          }
        }),
      );

      groups.push({
        lang,
        label: groupLabel(lang),
        results: enriched,
      });
    }

    return groups;
  });
}

export async function enrichCandidatesWithThumbnails<
  T extends { wikipediaLang: string; wikipediaTitle: string },
>(candidates: T[]): Promise<T[]> {
  return Promise.all(
    candidates.map(async (candidate) => {
      try {
        const thumbnailUrl = await fetchWikipediaThumbnail(
          candidate.wikipediaLang,
          candidate.wikipediaTitle,
        );
        return { ...candidate, thumbnailUrl };
      } catch (e) {
        console.error(
          "wikipedia thumbnail failed",
          candidate.wikipediaLang,
          candidate.wikipediaTitle,
          e,
        );
        return candidate;
      }
    }),
  );
}
