import { langToSitelinkKey, pickWikipediaSitelink } from "./wikipedia-lang.ts";

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const USER_AGENT =
  "Curolia/1.0 (https://github.com/curolia/curolia; plugin-wikidata)";

type WikidataEntity = {
  id?: string;
  labels?: Record<string, { value?: string }>;
  sitelinks?: Record<string, { title?: string }>;
};

export function looksLikeWikidataId(value: string): boolean {
  return /^Q\d+$/i.test(value.trim());
}

export function pickWikidataLabel(
  entity: WikidataEntity | undefined,
  langPrefs: string[],
  articleTitle: string,
  sparqlLabel?: string,
): string {
  const langs = [...langPrefs, "en"];
  for (const lang of langs) {
    const value = entity?.labels?.[lang]?.value?.trim();
    if (value && !looksLikeWikidataId(value)) return value;
  }

  for (const label of Object.values(entity?.labels ?? {})) {
    const value = label.value?.trim();
    if (value && !looksLikeWikidataId(value)) return value;
  }

  if (sparqlLabel && !looksLikeWikidataId(sparqlLabel)) return sparqlLabel;
  return articleTitle;
}

const WIKIDATA_ENTITY_BATCH_SIZE = 50;

async function fetchWikidataEntitiesBatch(
  wikidataIds: string[],
): Promise<Record<string, WikidataEntity>> {
  const params = new URLSearchParams({
    action: "wbgetentities",
    ids: wikidataIds.join("|"),
    props: "labels|sitelinks",
    format: "json",
    origin: "*",
  });
  const res = await fetch(`${WIKIDATA_API}?${params}`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`wikidata_entities_${res.status}`);
  }

  const json = (await res.json()) as {
    entities?: Record<string, WikidataEntity>;
  };
  return json.entities ?? {};
}

export async function fetchWikidataEntities(
  wikidataIds: string[],
): Promise<Record<string, WikidataEntity>> {
  if (wikidataIds.length === 0) return {};

  const merged: Record<string, WikidataEntity> = {};
  for (let i = 0; i < wikidataIds.length; i += WIKIDATA_ENTITY_BATCH_SIZE) {
    const batch = wikidataIds.slice(i, i + WIKIDATA_ENTITY_BATCH_SIZE);
    const entities = await fetchWikidataEntitiesBatch(batch);
    Object.assign(merged, entities);
  }
  return merged;
}

export async function resolveWikidataIdsForTitles(
  lang: string,
  titles: string[],
): Promise<Map<string, string>> {
  if (titles.length === 0) return new Map();

  const siteKey = langToSitelinkKey(lang);
  const params = new URLSearchParams({
    action: "wbgetentities",
    sites: siteKey,
    titles: titles.join("|"),
    props: "labels|sitelinks",
    format: "json",
    origin: "*",
  });
  const res = await fetch(`${WIKIDATA_API}?${params}`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`wikidata_resolve_${lang}_${res.status}`);
  }

  const json = (await res.json()) as {
    entities?: Record<string, WikidataEntity>;
  };

  const byTitle = new Map<string, string>();
  for (const [key, entity] of Object.entries(json.entities ?? {})) {
    if (key.startsWith("-") || !entity?.id) continue;
    const title = entity.sitelinks?.[siteKey]?.title?.trim();
    if (title) byTitle.set(title, entity.id);
  }
  return byTitle;
}

export type ResolvedWikipediaArticle = {
  lang: string;
  title: string;
  label: string;
};

export async function pickArticlesForWikidataIds(
  wikidataIds: string[],
  langPrefs: string[],
  sparqlLabels?: Map<string, string>,
): Promise<Map<string, ResolvedWikipediaArticle>> {
  const entities = await fetchWikidataEntities(wikidataIds);
  const out = new Map<string, ResolvedWikipediaArticle>();

  for (const id of wikidataIds) {
    const entity = entities[id];
    const picked = pickWikipediaSitelink(entity?.sitelinks, langPrefs);
    if (!picked) continue;
    out.set(id, {
      ...picked,
      label: pickWikidataLabel(
        entity,
        langPrefs,
        picked.title,
        sparqlLabels?.get(id),
      ),
    });
  }

  return out;
}
