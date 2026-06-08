import type { GoogleMapsSavedListSource } from "./config";
import type { GoogleMapsListSourcesResponse } from "./google-maps-saved-lists-edge";

export const GOOGLE_MAPS_STARRED_LIST_ID = "starred";
export const GOOGLE_MAPS_STARRED_LIST_LABEL = "Starred places";

export type GoogleMapsImportListOption = {
  id: string;
  label: string;
  itemCount: number;
  source: GoogleMapsSavedListSource;
};

export function googleMapsListLabel(source: GoogleMapsSavedListSource): string {
  return source.type === "starred"
    ? GOOGLE_MAPS_STARRED_LIST_LABEL
    : source.name;
}

/** Matches collection list ids from the export cache (`import-places.collectionId`). */
export function collectionListOptionId(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export function listOptionIdFromSource(
  source: GoogleMapsSavedListSource,
): string {
  return source.type === "starred"
    ? GOOGLE_MAPS_STARRED_LIST_ID
    : collectionListOptionId(source.name);
}

/** Map stored ids (slug or legacy display name) to current checklist option ids. */
export function resolveImportedListOptionIds(args: {
  configIds?: string[];
  statusIds?: string[];
  completedJobSources?: GoogleMapsSavedListSource[];
  options: GoogleMapsImportListOption[];
}): string[] {
  const raw = new Set<string>();
  for (const id of args.configIds ?? []) raw.add(id);
  for (const id of args.statusIds ?? []) raw.add(id);
  for (const source of args.completedJobSources ?? []) {
    raw.add(listOptionIdFromSource(source));
    if (source.type === "collection") raw.add(source.name);
  }

  if (args.options.length === 0) return [...raw];

  const optionIds = new Set(args.options.map((option) => option.id));
  const resolved = new Set<string>();
  for (const id of raw) {
    if (optionIds.has(id)) {
      resolved.add(id);
      continue;
    }
    const byName = args.options.find(
      (option) =>
        option.source.type === "collection" && option.source.name === id,
    );
    if (byName) {
      resolved.add(byName.id);
      continue;
    }
    const slug = collectionListOptionId(id);
    if (optionIds.has(slug)) resolved.add(slug);
  }
  return [...resolved];
}

export function buildGoogleMapsImportListOptions(
  data: GoogleMapsListSourcesResponse | undefined,
): GoogleMapsImportListOption[] {
  if (!data) return [];

  const options: GoogleMapsImportListOption[] = [
    {
      id: GOOGLE_MAPS_STARRED_LIST_ID,
      label: GOOGLE_MAPS_STARRED_LIST_LABEL,
      itemCount: data.starredCount ?? 0,
      source: { type: "starred" },
    },
  ];

  for (const collection of data.collections ?? []) {
    options.push({
      id: collectionListOptionId(collection.name),
      label: collection.name,
      itemCount: collection.itemCount,
      source: { type: "collection", name: collection.name },
    });
  }

  return options;
}
