export type CommonsNearbyCandidate = {
  fileTitle: string;
  pageId: number;
  title: string | null;
  displayUrl: string;
  thumbUrl: string;
  productUrl: string;
  width: number | null;
  height: number | null;
  licenseShortName: string | null;
  author: string | null;
  latitude: number;
  longitude: number;
  distanceM: number;
};

export function commonsExternalRef(
  candidate: CommonsNearbyCandidate,
): Record<string, unknown> {
  return {
    kind: "commons",
    fileTitle: candidate.fileTitle,
    pageId: candidate.pageId,
    displayUrl: candidate.displayUrl,
    thumbUrl: candidate.thumbUrl,
    productUrl: candidate.productUrl,
    licenseShortName: candidate.licenseShortName,
    author: candidate.author,
  };
}
