import { parsePageMetadata } from "./html-parse.ts";
import { domainFromUrl } from "./normalize-url.ts";
import type { ExtractedLocation, LinkMetadataExtract } from "./types.ts";
import { extractLocationFromUrl } from "./url-location.ts";
import { resolveLinkTitle } from "./url-title.ts";

export type AssembleLinkMetadataInput = {
  /** User-supplied URL (normalized). */
  url: string;
  /** URL after redirects. */
  finalUrl: string;
  /** Fetched HTML, when available. */
  html?: string | null;
  /** Resolved favicon URL (optional — edge function probes). */
  faviconUrl?: string | null;
};

function mergeLocations(
  ...candidates: (ExtractedLocation | null | undefined)[]
): ExtractedLocation | null {
  for (const c of candidates) {
    if (c) return c;
  }
  return null;
}

/** Build the API response shape from URL + optional HTML. */
export function assembleLinkMetadata(
  input: AssembleLinkMetadataInput,
): LinkMetadataExtract {
  const final = new URL(input.finalUrl);
  const target = new URL(input.url);

  const urlLocation = mergeLocations(
    extractLocationFromUrl(final),
    extractLocationFromUrl(target),
  );

  let title: string | null = null;
  let description: string | null = null;
  let faviconUrl = input.faviconUrl ?? null;
  let imageUrl: string | null = null;
  let htmlLocation: ExtractedLocation | null = null;

  if (input.html) {
    const parsed = parsePageMetadata(input.html, final);
    title = parsed.title;
    description = parsed.description;
    imageUrl = parsed.imageHref;
    htmlLocation = parsed.location;
    if (!faviconUrl && parsed.iconHref) faviconUrl = parsed.iconHref;
  }

  const location = mergeLocations(urlLocation, htmlLocation);
  const resolvedTitle = resolveLinkTitle({
    parsedTitle: title,
    finalUrl: input.finalUrl,
    locationLabel: location?.label,
  });
  const locationWithLabel =
    location && !location.label && resolvedTitle
      ? { ...location, label: resolvedTitle }
      : location;

  return {
    url: input.url,
    finalUrl: input.finalUrl,
    domain: domainFromUrl(final),
    title: resolvedTitle,
    description,
    faviconUrl,
    imageUrl,
    location: locationWithLabel,
  };
}
