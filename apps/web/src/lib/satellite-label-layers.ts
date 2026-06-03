import type {
  LayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from "maplibre-gl";

/** OpenMapTiles vector tiles (same source as OpenFreeMap Liberty). */
export const OPENFREEMAP_VECTOR_SOURCE = {
  type: "vector" as const,
  url: "https://tiles.openfreemap.org/planet",
};

export const OPENFREEMAP_GLYPHS =
  "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";

const PLACE_NAME_FIELD: NonNullable<
  SymbolLayerSpecification["layout"]
>["text-field"] = [
  "case",
  ["has", "name:nonlatin"],
  ["concat", ["get", "name:latin"], "\n", ["get", "name:nonlatin"]],
  ["coalesce", ["get", "name_en"], ["get", "name"]],
];

/** Polarsteps-like labels: light text on a dark halo over imagery. */
const LABEL_PAINT: NonNullable<SymbolLayerSpecification["paint"]> = {
  "text-color": "#ffffff",
  "text-halo-color": "rgba(0, 0, 0, 0.82)",
  "text-halo-width": 1.5,
  "text-halo-blur": 0.35,
};

const WATER_LABEL_PAINT: NonNullable<SymbolLayerSpecification["paint"]> = {
  "text-color": "rgba(210, 235, 255, 0.95)",
  "text-halo-color": "rgba(0, 0, 0, 0.78)",
  "text-halo-width": 1.5,
  "text-halo-blur": 0.35,
};

const COUNTRY_BOUNDARY_PAINT: NonNullable<LineLayerSpecification["paint"]> = {
  "line-color": "rgba(255, 255, 255, 0.88)",
  "line-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0.35, 4, 1],
  "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.75, 6, 1.25, 12, 2],
};

const REGION_BOUNDARY_PAINT: NonNullable<LineLayerSpecification["paint"]> = {
  "line-color": "rgba(255, 255, 255, 0.42)",
  "line-dasharray": [2, 2],
  "line-width": ["interpolate", ["linear"], ["zoom"], 7, 0.5, 11, 1],
};

const DISPUTED_BOUNDARY_PAINT: NonNullable<LineLayerSpecification["paint"]> = {
  "line-color": "rgba(255, 255, 255, 0.65)",
  "line-dasharray": [2, 3],
  "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.75, 8, 1.25],
};

/** Vector boundaries + place names over satellite imagery (no raster label pills). */
export function buildSatelliteLabelLayers(): LayerSpecification[] {
  return [
    {
      id: "satellite-boundary-disputed",
      type: "line",
      source: "openmaptiles",
      "source-layer": "boundary",
      filter: [
        "all",
        ["!=", ["get", "maritime"], 1],
        ["==", ["get", "disputed"], 1],
      ],
      paint: DISPUTED_BOUNDARY_PAINT,
    },
    {
      id: "satellite-boundary-country",
      type: "line",
      source: "openmaptiles",
      "source-layer": "boundary",
      filter: [
        "all",
        ["==", ["get", "admin_level"], 2],
        ["!=", ["get", "maritime"], 1],
        ["!=", ["get", "disputed"], 1],
        ["!", ["has", "claimed_by"]],
      ],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: COUNTRY_BOUNDARY_PAINT,
    },
    {
      id: "satellite-boundary-region",
      type: "line",
      source: "openmaptiles",
      "source-layer": "boundary",
      minzoom: 5,
      filter: [
        "all",
        [">=", ["get", "admin_level"], 3],
        ["<=", ["get", "admin_level"], 6],
        ["!=", ["get", "maritime"], 1],
        ["!=", ["get", "disputed"], 1],
        ["!", ["has", "claimed_by"]],
      ],
      paint: REGION_BOUNDARY_PAINT,
    },
    {
      id: "satellite-water-name-line",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "water_name",
      filter: [
        "match",
        ["geometry-type"],
        ["LineString", "MultiLineString"],
        true,
        false,
      ],
      layout: {
        "symbol-placement": "line",
        "symbol-spacing": 350,
        "text-field": PLACE_NAME_FIELD,
        "text-font": ["Noto Sans Italic"],
        "text-letter-spacing": 0.15,
        "text-max-width": 5,
        "text-size": 13,
      },
      paint: WATER_LABEL_PAINT,
    },
    {
      id: "satellite-water-name-point",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "water_name",
      filter: [
        "match",
        ["geometry-type"],
        ["MultiPoint", "Point"],
        true,
        false,
      ],
      layout: {
        "text-field": PLACE_NAME_FIELD,
        "text-font": ["Noto Sans Italic"],
        "text-letter-spacing": 0.15,
        "text-max-width": 5,
        "text-size": ["interpolate", ["linear"], ["zoom"], 0, 10, 8, 13],
      },
      paint: WATER_LABEL_PAINT,
    },
    {
      id: "satellite-label-country-3",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      minzoom: 2,
      maxzoom: 9,
      filter: [
        "all",
        ["==", ["get", "class"], "country"],
        [">=", ["get", "rank"], 3],
      ],
      layout: {
        "text-field": PLACE_NAME_FIELD,
        "text-font": ["Noto Sans Bold"],
        "text-max-width": 6.25,
        "text-size": ["interpolate", ["linear"], ["zoom"], 3, 9, 7, 16],
        "text-transform": "uppercase",
        "text-letter-spacing": 0.08,
      },
      paint: LABEL_PAINT,
    },
    {
      id: "satellite-label-country-2",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      maxzoom: 9,
      filter: [
        "all",
        ["==", ["get", "class"], "country"],
        ["==", ["get", "rank"], 2],
      ],
      layout: {
        "text-field": PLACE_NAME_FIELD,
        "text-font": ["Noto Sans Bold"],
        "text-max-width": 6.25,
        "text-size": ["interpolate", ["linear"], ["zoom"], 2, 10, 5, 18],
        "text-transform": "uppercase",
        "text-letter-spacing": 0.08,
      },
      paint: LABEL_PAINT,
    },
    {
      id: "satellite-label-country-1",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      maxzoom: 9,
      filter: [
        "all",
        ["==", ["get", "class"], "country"],
        ["==", ["get", "rank"], 1],
      ],
      layout: {
        "text-field": PLACE_NAME_FIELD,
        "text-font": ["Noto Sans Bold"],
        "text-max-width": 6.25,
        "text-size": ["interpolate", ["linear"], ["zoom"], 1, 11, 4, 20],
        "text-transform": "uppercase",
        "text-letter-spacing": 0.1,
      },
      paint: LABEL_PAINT,
    },
    {
      id: "satellite-label-state",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      minzoom: 5,
      maxzoom: 8,
      filter: ["==", ["get", "class"], "state"],
      layout: {
        "text-field": PLACE_NAME_FIELD,
        "text-font": ["Noto Sans Regular"],
        "text-letter-spacing": 0.12,
        "text-max-width": 9,
        "text-size": ["interpolate", ["linear"], ["zoom"], 5, 10, 8, 13],
        "text-transform": "uppercase",
      },
      paint: LABEL_PAINT,
    },
    {
      id: "satellite-label-city",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      minzoom: 3,
      filter: [
        "all",
        ["==", ["get", "class"], "city"],
        ["!=", ["get", "capital"], 2],
      ],
      layout: {
        "text-field": PLACE_NAME_FIELD,
        "text-font": ["Noto Sans Regular"],
        "text-max-width": 8,
        "text-size": [
          "interpolate",
          ["exponential", 1.2],
          ["zoom"],
          4,
          11,
          7,
          13,
          11,
          17,
        ],
      },
      paint: LABEL_PAINT,
    },
    {
      id: "satellite-label-city-capital",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      minzoom: 3,
      filter: [
        "all",
        ["==", ["get", "class"], "city"],
        ["==", ["get", "capital"], 2],
      ],
      layout: {
        "text-field": PLACE_NAME_FIELD,
        "text-font": ["Noto Sans Bold"],
        "text-max-width": 8,
        "text-size": [
          "interpolate",
          ["exponential", 1.2],
          ["zoom"],
          4,
          12,
          7,
          14,
          11,
          19,
        ],
      },
      paint: LABEL_PAINT,
    },
    {
      id: "satellite-label-town",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      minzoom: 6,
      filter: ["==", ["get", "class"], "town"],
      layout: {
        "text-field": PLACE_NAME_FIELD,
        "text-font": ["Noto Sans Regular"],
        "text-max-width": 8,
        "text-size": [
          "interpolate",
          ["exponential", 1.2],
          ["zoom"],
          7,
          11,
          11,
          13,
        ],
      },
      paint: LABEL_PAINT,
    },
    {
      id: "satellite-label-village",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      minzoom: 9,
      filter: ["==", ["get", "class"], "village"],
      layout: {
        "text-field": PLACE_NAME_FIELD,
        "text-font": ["Noto Sans Regular"],
        "text-max-width": 8,
        "text-size": [
          "interpolate",
          ["exponential", 1.2],
          ["zoom"],
          9,
          10,
          12,
          11,
        ],
      },
      paint: LABEL_PAINT,
    },
    {
      id: "satellite-label-other",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      minzoom: 8,
      filter: [
        "match",
        ["get", "class"],
        ["city", "continent", "country", "state", "town", "village"],
        false,
        true,
      ],
      layout: {
        "text-field": PLACE_NAME_FIELD,
        "text-font": ["Noto Sans Regular"],
        "text-letter-spacing": 0.08,
        "text-max-width": 9,
        "text-size": ["interpolate", ["linear"], ["zoom"], 8, 9, 12, 10],
        "text-transform": "uppercase",
      },
      paint: LABEL_PAINT,
    },
  ];
}
