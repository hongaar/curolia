/** A coordinate pair extracted from a URL or page metadata. */
export type ExtractedLocation = {
  lat: number;
  lng: number;
  /** Human-readable place name when known (e.g. from og:title on a place page). */
  label?: string | null;
  /** Which extractor produced this result (for debugging). */
  source: string;
};

export type ParsedPageHead = {
  title: string | null;
  description: string | null;
  iconHref: string | null;
  imageHref: string | null;
  location: ExtractedLocation | null;
};

/** Full metadata assembled after URL resolution and optional HTML fetch. */
export type LinkMetadataExtract = {
  url: string;
  finalUrl: string;
  domain: string;
  title: string | null;
  description: string | null;
  faviconUrl: string | null;
  imageUrl: string | null;
  location: ExtractedLocation | null;
};
