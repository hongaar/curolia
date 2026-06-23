import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type E2eSeedFixture = {
  userId: string;
  userEmail: string;
  userPassword: string;
  profileSlug: string;
  mapId: string;
  mapSlug: string;
  mapUrl: string;
  targetPinId: string;
  targetPinSlug: string;
  clusterPinId: string;
  pinCount: number;
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
};

const fixturePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "seed.json",
);

export const seed: E2eSeedFixture = JSON.parse(
  fs.readFileSync(fixturePath, "utf8"),
) as E2eSeedFixture;

export function mapUrlWithCamera(
  fixture: E2eSeedFixture = seed,
  pinSlug?: string,
): string {
  return mapUrlWithCameraAt(fixture, {
    lat: fixture.mapCenter.lat,
    lng: fixture.mapCenter.lng,
    zoom: fixture.mapZoom,
    pinSlug,
  });
}

export function mapUrlWithCameraAt(
  fixture: E2eSeedFixture = seed,
  opts: {
    lat: number;
    lng: number;
    zoom: number;
    pinSlug?: string;
  },
): string {
  const params = new URLSearchParams({
    lat: String(opts.lat),
    lng: String(opts.lng),
    zoom: String(opts.zoom),
  });
  if (opts.pinSlug) params.set("pin", opts.pinSlug);
  return `${fixture.mapUrl}?${params.toString()}`;
}

export function targetPinCamera(fixture: E2eSeedFixture = seed) {
  return {
    lat: fixture.mapCenter.lat + 0.01,
    lng: fixture.mapCenter.lng + 0.01,
    zoom: 17,
  };
}

export function clusterCamera(fixture: E2eSeedFixture = seed) {
  return {
    lat: fixture.mapCenter.lat,
    lng: fixture.mapCenter.lng,
    zoom: 18,
  };
}
