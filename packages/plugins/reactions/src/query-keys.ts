import { REACTIONS_PLUGIN_ID } from "./config";

export function pinReactionsQueryKey(pinId: string) {
  return ["pin_reactions", pinId] as const;
}

export function reactionsMapPluginQueryKey(mapId: string) {
  return ["map_plugins", mapId, REACTIONS_PLUGIN_ID] as const;
}

export function reactionsMapPublicQueryKey(mapId: string) {
  return ["maps", mapId, "is_public"] as const;
}
