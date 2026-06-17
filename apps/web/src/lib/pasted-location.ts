import type { Coords } from "@curolia/services/coords";
import { parseLocationCoordinates } from "@curolia/services/coords";
import { searchPlaces } from "@curolia/services/geocoding";
import { decodePlusCode, parsePlusCodeText } from "@curolia/services/plus-code";

export type PastedLocation = Coords & { label?: string | null };

/** Whether clipboard plain text looks like coordinates or a Plus Code. */
export function looksLikePastedLocation(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || /[\r\n]/.test(trimmed)) return false;
  return Boolean(
    parseLocationCoordinates(trimmed) || parsePlusCodeText(trimmed),
  );
}

/** Resolve decimal/DMS coordinates or Plus Codes from pasted text. */
export async function resolvePastedLocation(
  text: string,
  options?: { mapCenter?: Coords | null },
): Promise<PastedLocation | null> {
  const trimmed = text.trim();
  if (!trimmed || /[\r\n]/.test(trimmed)) return null;

  const coords = parseLocationCoordinates(trimmed);
  if (coords) return coords;

  const plus = parsePlusCodeText(trimmed);
  if (!plus) return null;

  let reference: Coords | null = options?.mapCenter ?? null;
  if (plus.locality) {
    const places = await searchPlaces(plus.locality);
    const first = places[0];
    if (first) reference = { lat: first.lat, lng: first.lng };
  }

  const decoded = decodePlusCode(plus.code, reference);
  if (!decoded) return null;

  return {
    ...decoded,
    label: plus.locality,
  };
}
