/** Stable ids and labels shared by manifest and pin UI (single source of truth). */
export const flickrPluginMeta = {
  typeId: "flickr" as const,
  displayName: "Flickr",
  /** Flickr API keys require an active Pro subscription; keep code for later. */
  implemented: false as const,
} as const;
