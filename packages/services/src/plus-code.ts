import { OpenLocationCode } from "open-location-code";
import { isValidLatLng, type Coords } from "./coords.ts";

type OlcApi = {
  isValid(code: string): boolean;
  isShort(code: string): boolean;
  isFull(code: string): boolean;
  decode(code: string): {
    latitudeCenter: number;
    longitudeCenter: number;
  };
  recoverNearest(code: string, lat: number, lng: number): string;
};

const olc = new OpenLocationCode() as unknown as OlcApi;

export type ParsedPlusCode = {
  code: string;
  locality: string | null;
};

const PLUS_CODE_BODY =
  "[23456789CFGHJMPQRVWX]{4,8}\\+[23456789CFGHJMPQRVWX]{2,3}";
const PLUS_CODE_TEXT = new RegExp(`^(${PLUS_CODE_BODY})(?:\\s+(.+))?$`, "i");

/** Extract a Google Plus Code (and optional locality suffix) from pasted text. */
export function parsePlusCodeText(raw: string): ParsedPlusCode | null {
  const trimmed = raw.trim();
  if (!trimmed || /[\r\n]/.test(trimmed)) return null;

  const match = trimmed.match(PLUS_CODE_TEXT);
  if (!match?.[1]) return null;

  const code = match[1].toUpperCase();
  if (!olc.isValid(code)) return null;

  const locality = match[2]?.trim() || null;
  return { code, locality };
}

/** Decode a full Plus Code, or a short code with a nearby reference point. */
export function decodePlusCode(
  code: string,
  reference?: Coords | null,
): Coords | null {
  const normalized = code.trim().toUpperCase();
  if (!olc.isValid(normalized)) return null;

  let fullCode = normalized;
  if (olc.isShort(normalized)) {
    if (!reference || !isValidLatLng(reference.lat, reference.lng)) return null;
    try {
      fullCode = olc.recoverNearest(normalized, reference.lat, reference.lng);
    } catch {
      return null;
    }
  } else if (!olc.isFull(normalized)) {
    return null;
  }

  try {
    const area = olc.decode(fullCode);
    return { lat: area.latitudeCenter, lng: area.longitudeCenter };
  } catch {
    return null;
  }
}
