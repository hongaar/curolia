import type { ExploreBounds } from "@curolia/plugin-contract";

import type { ExploreViewport } from "./explore-results";

export type MapCameraWithBounds = {
  lat: number;
  lng: number;
  zoom: number;
  bounds: ExploreBounds;
};

export function boundsFromMapLibre(bounds: {
  getWest: () => number;
  getSouth: () => number;
  getEast: () => number;
  getNorth: () => number;
}): ExploreBounds {
  return {
    west: bounds.getWest(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    north: bounds.getNorth(),
  };
}

export function viewportFromCamera(
  camera: { lat: number; lng: number; zoom: number },
  bounds: ExploreBounds,
): ExploreViewport {
  return {
    mapCenter: { lat: camera.lat, lng: camera.lng },
    zoom: camera.zoom,
    bounds,
  };
}

export function approximateBoundsFromCenter(
  center: { lat: number; lng: number },
  zoom: number,
): ExploreBounds {
  const latRad = (center.lat * Math.PI) / 180;
  const metersPerPixel = (156_543.03392 * Math.cos(latRad)) / Math.pow(2, zoom);
  const halfWidthM = metersPerPixel * 256;
  const halfHeightM = metersPerPixel * 256;
  const metersPerDegreeLat = 111_320;
  const metersPerDegreeLng = 111_320 * Math.cos(latRad);
  const dLat = halfHeightM / metersPerDegreeLat;
  const dLng = halfWidthM / metersPerDegreeLng;
  return {
    west: center.lng - dLng,
    south: center.lat - dLat,
    east: center.lng + dLng,
    north: center.lat + dLat,
  };
}

const BOUNDS_QUANTIZE_DECIMALS = 3;
const ZOOM_QUANTIZE_DECIMALS = 2;

function quantizeCoord(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Coarsen bounds/zoom so resize jitter does not churn explore query keys. */
export function quantizeExploreViewport(
  viewport: ExploreViewport,
): ExploreViewport {
  return {
    mapCenter: {
      lng: quantizeCoord(viewport.mapCenter.lng, BOUNDS_QUANTIZE_DECIMALS),
      lat: quantizeCoord(viewport.mapCenter.lat, BOUNDS_QUANTIZE_DECIMALS),
    },
    zoom: quantizeCoord(viewport.zoom, ZOOM_QUANTIZE_DECIMALS),
    bounds: {
      west: quantizeCoord(viewport.bounds.west, BOUNDS_QUANTIZE_DECIMALS),
      south: quantizeCoord(viewport.bounds.south, BOUNDS_QUANTIZE_DECIMALS),
      east: quantizeCoord(viewport.bounds.east, BOUNDS_QUANTIZE_DECIMALS),
      north: quantizeCoord(viewport.bounds.north, BOUNDS_QUANTIZE_DECIMALS),
    },
  };
}

export function exploreViewportSyncKey(viewport: ExploreViewport): string {
  const q = quantizeExploreViewport(viewport);
  return [
    q.bounds.west,
    q.bounds.south,
    q.bounds.east,
    q.bounds.north,
    q.zoom,
    q.mapCenter.lng,
    q.mapCenter.lat,
  ].join("|");
}

export function mapCameraWithBoundsEqual(
  a: MapCameraWithBounds,
  b: MapCameraWithBounds,
): boolean {
  return (
    exploreViewportSyncKey(
      viewportFromCamera({ lat: a.lat, lng: a.lng, zoom: a.zoom }, a.bounds),
    ) ===
    exploreViewportSyncKey(
      viewportFromCamera({ lat: b.lat, lng: b.lng, zoom: b.zoom }, b.bounds),
    )
  );
}
