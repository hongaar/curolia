import { commonsPluginMeta } from "./plugin-meta";

export function commonsNearbyCandidatesQueryKey(pinId: string) {
  return [
    "commons_nearby_candidates",
    commonsPluginMeta.typeId,
    pinId,
  ] as const;
}
