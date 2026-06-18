export type FlickrNearbyCandidate = {
  photoId: string;
  secret: string;
  server: string;
  farm: number;
  owner: string;
  pathAlias: string | null;
  title: string | null;
  displayUrl: string;
  thumbUrl: string;
  productUrl: string;
  width: number | null;
  height: number | null;
  capturedAt: string | null;
  latitude: number;
  longitude: number;
  distanceM: number;
};

export function flickrExternalRef(
  candidate: FlickrNearbyCandidate,
): Record<string, unknown> {
  return {
    kind: "flickr",
    photoId: candidate.photoId,
    secret: candidate.secret,
    server: candidate.server,
    farm: candidate.farm,
    owner: candidate.owner,
    pathAlias: candidate.pathAlias,
    displayUrl: candidate.displayUrl,
    thumbUrl: candidate.thumbUrl,
    productUrl: candidate.productUrl,
  };
}
