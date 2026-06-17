/** Gravatar image URL from a precomputed SHA-256 hash. */
export function gravatarUrlFromHash(hashHex: string, sizePx = 40): string {
  const params = new URLSearchParams({
    s: String(sizePx),
    d: "404",
    r: "g",
  });
  return `https://www.gravatar.com/avatar/${hashHex}?${params.toString()}`;
}
