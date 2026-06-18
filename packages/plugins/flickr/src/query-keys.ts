import { flickrPluginMeta } from "./plugin-meta";

export function flickrNearbyCandidatesQueryKey(pinId: string) {
  return ["flickr_nearby_candidates", flickrPluginMeta.typeId, pinId] as const;
}
