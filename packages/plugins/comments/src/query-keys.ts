import { COMMENTS_PLUGIN_ID } from "./config";

export function pinCommentsQueryKey(pinId: string) {
  return ["pin_comments", pinId] as const;
}

export function commentsMapPluginQueryKey(mapId: string) {
  return ["map_plugins", mapId, COMMENTS_PLUGIN_ID] as const;
}

export function commentsMapPublicQueryKey(mapId: string) {
  return ["maps", mapId, "is_public"] as const;
}
