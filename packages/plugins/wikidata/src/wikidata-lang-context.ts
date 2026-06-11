import { readCountryFromGeocode } from "./wikipedia-lang";

export function wikidataBrowserLang(): string | undefined {
  if (typeof navigator === "undefined") return undefined;
  return navigator.language;
}

export type WikidataLangInvokeFields = {
  browserLang?: string;
  country?: string;
};

export function wikidataLangInvokeFields(
  geocode?: unknown,
): WikidataLangInvokeFields {
  const country = readCountryFromGeocode(geocode);
  return {
    browserLang: wikidataBrowserLang(),
    ...(country ? { country } : {}),
  };
}
