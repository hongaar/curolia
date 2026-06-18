/** Best-effort link to a file page on Wikimedia Commons. */
export function commonsProductUrl(
  ref: Record<string, unknown> | null | undefined,
): string | undefined {
  if (!ref) return undefined;

  const explicit = ref.productUrl;
  if (typeof explicit === "string" && explicit.length > 0) return explicit;

  const fileTitle = ref.fileTitle;
  if (typeof fileTitle !== "string" || fileTitle.length === 0) return undefined;

  return commonsFilePageUrl(fileTitle);
}

export function commonsFilePageUrl(fileTitle: string): string {
  const normalized = fileTitle.trim().replace(/ /g, "_");
  return `https://commons.wikimedia.org/wiki/${encodeURIComponent(normalized)}`;
}
