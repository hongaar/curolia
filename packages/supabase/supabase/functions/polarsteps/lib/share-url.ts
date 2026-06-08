export type ParsedPolarstepsShareUrl = {
  tripId: string;
  secret?: string;
  shareUrl: string;
};

export function parsePolarstepsShareUrl(
  raw: string,
): ParsedPolarstepsShareUrl | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (!/polarsteps\.com$/i.test(url.hostname.replace(/^www\./, ""))) {
    return null;
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const tripPart = parts[1]!;
  const dash = tripPart.indexOf("-");
  const tripId = dash > 0 ? tripPart.slice(0, dash) : tripPart;
  if (!/^\d+$/.test(tripId)) return null;

  const secret = url.searchParams.get("s") ?? undefined;

  return {
    tripId,
    secret,
    shareUrl: trimmed,
  };
}

export function buildTripApiUrl(tripId: string, secret?: string): string {
  const base = `https://api.polarsteps.com/trips/${tripId}`;
  if (secret) return `${base}?s=${encodeURIComponent(secret)}`;
  return base;
}
