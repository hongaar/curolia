export function normalizeRequestUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let candidate = trimmed;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  try {
    const u = new URL(candidate);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname) return null;
    return u;
  } catch {
    return null;
  }
}

export function domainFromUrl(url: URL | string): string {
  const u = typeof url === "string" ? new URL(url) : url;
  return u.hostname.replace(/^www\./i, "");
}
