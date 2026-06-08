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

export function listOptionIdFromSource(
  source: GoogleMapsSavedListSource,
): string {
  return source.type === "starred" ? GOOGLE_MAPS_STARRED_LIST_ID : source.name;
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
      id: collection.id,
      label: collection.name,
      itemCount: collection.itemCount,
      source: { type: "collection", name: collection.name },
    });
  }

  return options;
}
