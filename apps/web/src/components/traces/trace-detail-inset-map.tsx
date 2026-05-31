import {
  createMapMarkerMount,
  type MapMarkerMount,
} from "@curolia/ui/map-marker";
import {
  TraceDetailInsetMap,
  TraceDetailInsetMapCanvas,
  TraceDetailInsetMapLink,
} from "@curolia/ui/trace-detail";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

const MAP_STYLE_LIGHT = "https://tiles.openfreemap.org/styles/positron";
const MAP_STYLE_DARK = "https://tiles.openfreemap.org/styles/dark";
const INSET_ZOOM = 5;

function mapStyleUrlForTheme(resolvedTheme: string | undefined): string {
  if (resolvedTheme === "dark") return MAP_STYLE_DARK;
  if (resolvedTheme === "light") return MAP_STYLE_LIGHT;
  if (
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
  ) {
    return MAP_STYLE_DARK;
  }
  return MAP_STYLE_LIGHT;
}

type TraceDetailInsetMapViewProps = {
  lng: number;
  lat: number;
  markerEmoji: string;
  markerColor: string | null;
  mapHref: string;
  mapAriaLabel: string;
};

export function TraceDetailInsetMapView({
  lng,
  lat,
  markerEmoji,
  markerColor,
  mapHref,
  mapAriaLabel,
}: TraceDetailInsetMapViewProps) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const markerMountRef = useRef<MapMarkerMount | null>(null);
  const appliedMapStyleUrlRef = useRef("");

  useEffect(() => {
    if (!containerRef.current) return;
    const initialStyle =
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
        ? MAP_STYLE_DARK
        : MAP_STYLE_LIGHT;
    appliedMapStyleUrlRef.current = initialStyle;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: initialStyle,
      center: [lng, lat],
      zoom: INSET_ZOOM,
      attributionControl: false,
      maplibreLogo: false,
      interactive: false,
      dragPan: false,
      scrollZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoomRotate: false,
    });
    map.addControl(
      new maplibregl.AttributionControl({ compact: false }),
      "bottom-right",
    );
    mapRef.current = map;
    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      markerMountRef.current?.unmount();
      markerMountRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map instance is created once per mount
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const url = mapStyleUrlForTheme(resolvedTheme);
    if (appliedMapStyleUrlRef.current === url) return;
    appliedMapStyleUrlRef.current = url;
    map.setStyle(url);
  }, [resolvedTheme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.jumpTo({ center: [lng, lat], zoom: INSET_ZOOM });
  }, [lng, lat]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markerRef.current?.remove();
    markerRef.current = null;
    markerMountRef.current?.unmount();
    markerMountRef.current = null;

    const mount = createMapMarkerMount({
      emoji: markerEmoji,
      fill: markerColor,
      selected: true,
      interactive: false,
      pointerEvents: "none",
    });
    markerMountRef.current = mount;
    const marker = new maplibregl.Marker({ element: mount.element })
      .setLngLat([lng, lat])
      .addTo(map);
    markerRef.current = marker;
    return () => {
      marker.remove();
      if (markerRef.current === marker) markerRef.current = null;
      mount.unmount();
      if (markerMountRef.current === mount) markerMountRef.current = null;
    };
  }, [lng, lat, markerEmoji, markerColor]);

  return (
    <TraceDetailInsetMapLink to={mapHref} ariaLabel={mapAriaLabel}>
      <TraceDetailInsetMap>
        <TraceDetailInsetMapCanvas containerRef={containerRef} />
      </TraceDetailInsetMap>
    </TraceDetailInsetMapLink>
  );
}
