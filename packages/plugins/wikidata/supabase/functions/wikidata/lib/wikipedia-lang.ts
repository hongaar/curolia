/** Keep in sync with `packages/plugins/wikidata/src/wikipedia-lang.ts`. */

export const WIKIPEDIA_LANGUAGE_AUTO = "auto" as const;

export type WikipediaLanguageSetting =
  | typeof WIKIPEDIA_LANGUAGE_AUTO
  | "en"
  | "nl"
  | "de"
  | "fr"
  | "es"
  | "it"
  | "pt"
  | "pl"
  | "ja";

const COUNTRY_LANGUAGE_HINTS: Readonly<Record<string, readonly string[]>> = {
  netherlands: ["nl"],
  belgium: ["nl", "fr"],
  germany: ["de"],
  austria: ["de"],
  switzerland: ["de", "fr", "it"],
  france: ["fr"],
  spain: ["es"],
  italy: ["it"],
  portugal: ["pt"],
  poland: ["pl"],
  japan: ["ja"],
  "united kingdom": ["en"],
  "united states": ["en"],
  "united states of america": ["en"],
};

const SETTING_VALUES = new Set<string>([
  WIKIPEDIA_LANGUAGE_AUTO,
  "en",
  "nl",
  "de",
  "fr",
  "es",
  "it",
  "pt",
  "pl",
  "ja",
]);

export function readWikipediaLanguageSetting(
  config: unknown,
): WikipediaLanguageSetting {
  if (!config || typeof config !== "object") return WIKIPEDIA_LANGUAGE_AUTO;
  const wikidata = (config as { wikidata?: unknown }).wikidata;
  if (!wikidata || typeof wikidata !== "object") return WIKIPEDIA_LANGUAGE_AUTO;
  const raw = (wikidata as { wikipediaLanguage?: unknown }).wikipediaLanguage;
  if (typeof raw !== "string" || !SETTING_VALUES.has(raw)) {
    return WIKIPEDIA_LANGUAGE_AUTO;
  }
  return raw as WikipediaLanguageSetting;
}

export function normalizeLangCode(
  input: string | null | undefined,
): string | null {
  if (!input) return null;
  const base = input.trim().toLowerCase().split("-")[0]?.split("_")[0];
  if (!base || base.length < 2) return null;
  return base;
}

export function countryLanguageHints(
  country: string | null | undefined,
): string[] {
  if (!country) return [];
  const key = country.trim().toLowerCase();
  return [...(COUNTRY_LANGUAGE_HINTS[key] ?? [])];
}

export function resolveLangPrefs(
  setting: WikipediaLanguageSetting,
  opts?: {
    browserLang?: string | null;
    country?: string | null;
  },
): string[] {
  const prefs: string[] = [];
  const add = (lang: string | null | undefined) => {
    const normalized = normalizeLangCode(lang);
    if (normalized && !prefs.includes(normalized)) prefs.push(normalized);
  };

  if (setting !== WIKIPEDIA_LANGUAGE_AUTO) {
    add(setting);
  } else {
    add(opts?.browserLang);
    for (const lang of countryLanguageHints(opts?.country)) add(lang);
  }

  add("en");
  return prefs;
}

export function readCountryFromGeocode(geocode: unknown): string | null {
  if (!geocode || typeof geocode !== "object") return null;
  const properties = (geocode as { properties?: unknown }).properties;
  if (!properties || typeof properties !== "object") return null;
  const country = (properties as { country?: unknown }).country;
  return typeof country === "string" && country.trim() ? country.trim() : null;
}

export function wikipediaSearchGroupLabel(lang: string): string {
  const labels: Record<string, string> = {
    en: "English Wikipedia",
    nl: "Nederlands Wikipedia",
    de: "Deutsch Wikipedia",
    fr: "Français Wikipedia",
    es: "Español Wikipedia",
    it: "Italiano Wikipedia",
    pt: "Português Wikipedia",
    pl: "Polski Wikipedia",
    ja: "日本語 Wikipedia",
  };
  return labels[lang] ?? `${lang.toUpperCase()} Wikipedia`;
}

export function langToSitelinkKey(lang: string): string {
  return `${normalizeLangCode(lang) ?? lang}wiki`;
}

const NON_WIKIPEDIA_SITELINKS = new Set([
  "commonswiki",
  "wikidatawiki",
  "specieswiki",
  "mediawikiwiki",
]);

export function pickWikipediaSitelink(
  sitelinks: Record<string, { title?: string }> | undefined,
  langPrefs: string[],
): { lang: string; title: string } | null {
  if (!sitelinks) return null;

  for (const lang of langPrefs) {
    const key = langToSitelinkKey(lang);
    const title = sitelinks[key]?.title?.trim();
    if (title) return { lang: normalizeLangCode(lang) ?? lang, title };
  }

  for (const [key, link] of Object.entries(sitelinks)) {
    if (!key.endsWith("wiki") || NON_WIKIPEDIA_SITELINKS.has(key)) continue;
    const title = link.title?.trim();
    if (!title) continue;
    const lang = key.slice(0, -4);
    if (lang.length < 2) continue;
    return { lang, title };
  }

  return null;
}
