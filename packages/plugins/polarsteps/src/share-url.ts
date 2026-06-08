export type ParsedPolarstepsShareUrl = {
  tripId: string;
  secret?: string;
  shareUrl: string;
};

/**
 * Parse a Polarsteps trip share URL.
 * Example: https://www.polarsteps.com/Username/12345678-trip-name?s=secret
 */
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

export function tripOptionId(tripId: string): string {
  return tripId;
}
