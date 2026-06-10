/**
 * Vite/Rolldown production builds leave MapLibre's default worker URL empty.
 * GeoJSON `lineMetrics` (required for `line-gradient` route lines) is computed
 * in that worker — without this, gradients render nothing in prod while dev works.
 */
import { setWorkerUrl } from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-csp-worker.js?url";

setWorkerUrl(maplibreWorkerUrl);
