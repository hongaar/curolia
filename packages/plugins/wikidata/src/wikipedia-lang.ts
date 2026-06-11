/** Keep in sync with `supabase/functions/wikidata/lib/wikipedia-lang.ts`. */

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

export const WIKIPEDIA_LANGUAGE_OPTIONS: ReadonlyArray<{
  value: WikipediaLanguageSetting;
  label: string;
}> = [
  { value: WIKIPEDIA_LANGUAGE_AUTO, label: "Auto" },
  { value: "en", label: "English" },
  { value: "nl", label: "Nederlands" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "it", label: "Italiano" },
  { value: "pt", label: "Português" },
  { value: "pl", label: "Polski" },
  { value: "ja", label: "日本語" },
];

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

export function readWikipediaLanguageSetting(
  config: unknown,
): WikipediaLanguageSetting {
  if (!config || typeof config !== "object") return WIKIPEDIA_LANGUAGE_AUTO;
  const wikidata = (config as { wikidata?: unknown }).wikidata;
  if (!wikidata || typeof wikidata !== "object") return WIKIPEDIA_LANGUAGE_AUTO;
  const raw = (wikidata as { wikipediaLanguage?: unknown }).wikipediaLanguage;
  if (typeof raw !== "string") return WIKIPEDIA_LANGUAGE_AUTO;
  const match = WIKIPEDIA_LANGUAGE_OPTIONS.find((o) => o.value === raw);
  return match?.value ?? WIKIPEDIA_LANGUAGE_AUTO;
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

export function wikipediaLanguageLabel(lang: string): string {
  const option = WIKIPEDIA_LANGUAGE_OPTIONS.find((o) => o.value === lang);
  if (option) return option.label;
  return lang.toUpperCase();
}

export function wikipediaLanguageBadge(lang: string): string {
  return lang.trim().toUpperCase();
}

export function shouldShowWikipediaLanguageBadge(lang: string): boolean {
  return lang.trim().toLowerCase() !== "en";
}

export function wikipediaSearchGroupLabel(lang: string): string {
  if (lang === "en") return "English Wikipedia";
  const option = WIKIPEDIA_LANGUAGE_OPTIONS.find((o) => o.value === lang);
  if (option) return `${option.label} Wikipedia`;
  return `${lang.toUpperCase()} Wikipedia`;
}

export function readCountryFromGeocode(geocode: unknown): string | null {
  if (!geocode || typeof geocode !== "object") return null;
  const properties = (geocode as { properties?: unknown }).properties;
  if (!properties || typeof properties !== "object") return null;
  const country = (properties as { country?: unknown }).country;
  return typeof country === "string" && country.trim() ? country.trim() : null;
}
