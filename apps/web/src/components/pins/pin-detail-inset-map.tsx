import {
  DEFAULT_MAP_STYLE_OPTIONS,
  mapStyleCacheKey,
  normalizeMapStylePreset,
  resolveMapStyle,
  syncMapStyleOverlays,
  type MapStyleOptions,
  type MapStylePreset,
} from "@/lib/map-style";
import { isMapStyleReady } from "@/lib/pin-map-route-layers";
import {
  createMapMarkerMount,
  type MapMarkerMount,
} from "@curolia/ui/map-marker";
import {
  PinDetailInsetMap,
  PinDetailInsetMapCanvas,
  PinDetailInsetMapLink,
} from "@curolia/ui/pin-detail";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "next-themes";
import { useEffect, useLayoutEffect, useRef } from "react";

const INSET_ZOOM = 5;

type PinDetailInsetMapViewProps = {
  lng: number;
  lat: number;
  markerEmoji: string | null;
  markerColor: string | null;
  markerPhotoUrl?: string | null;
  mapHref: string;
  mapAriaLabel: string;
  mapStyle?: MapStylePreset;
  mapStyleOptions?: MapStyleOptions;
};

export function PinDetailInsetMapView({
  lng,
  lat,
  markerEmoji,
  markerColor,
  markerPhotoUrl = null,
  mapHref,
  mapAriaLabel,
  mapStyle = "auto",
  mapStyleOptions = DEFAULT_MAP_STYLE_OPTIONS,
}: PinDetailInsetMapViewProps) {
  const { resolvedTheme } = useTheme();
  const mapStylePreset = normalizeMapStylePreset(mapStyle);
  const mapStyleOpts = mapStyleOptions;
  const mapStylePresetRef = useRef(mapStylePreset);
  const mapStyleOptsRef = useRef(mapStyleOpts);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const markerMountRef = useRef<MapMarkerMount | null>(null);
  const appliedMapStyleKeyRef = useRef("");

  useLayoutEffect(() => {
    mapStylePresetRef.current = mapStylePreset;
    mapStyleOptsRef.current = mapStyleOpts;
  }, [mapStylePreset, mapStyleOpts]);

  useEffect(() => {
    if (!containerRef.current) return;
    const initialStyle = resolveMapStyle(
      mapStylePreset,
      resolvedTheme,
      mapStyleOpts,
    );
    appliedMapStyleKeyRef.current = mapStyleCacheKey(
      mapStylePreset,
      resolvedTheme,
      mapStyleOpts,
    );
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
    const onStyleLoad = () => {
      syncMapStyleOverlays(
        map,
        mapStylePresetRef.current,
        mapStyleOptsRef.current,
      );
    };
    map.on("style.load", onStyleLoad);
    mapRef.current = map;
    return () => {
      map.off("style.load", onStyleLoad);
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
    const key = mapStyleCacheKey(mapStylePreset, resolvedTheme, mapStyleOpts);
    if (appliedMapStyleKeyRef.current === key) return;

    const applyStyle = () => {
      if (!mapRef.current) return;
      appliedMapStyleKeyRef.current = key;
      const style = resolveMapStyle(
        mapStylePreset,
        resolvedTheme,
        mapStyleOpts,
      );
      const onStyleLoad = () => {
        syncMapStyleOverlays(
          map,
          mapStylePresetRef.current,
          mapStyleOptsRef.current,
        );
      };
      map.once("style.load", onStyleLoad);
      map.setStyle(style);
    };

    if (map.style && map.isStyleLoaded()) {
      applyStyle();
    } else {
      map.once("load", applyStyle);
    }
  }, [mapStylePreset, resolvedTheme, mapStyleOpts]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!isMapStyleReady(map)) return;
    syncMapStyleOverlays(map, mapStylePreset, mapStyleOpts);
  }, [mapStylePreset, mapStyleOpts]);

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
      photoUrl: markerPhotoUrl,
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
  }, [lng, lat, markerEmoji, markerColor, markerPhotoUrl]);

  return (
    <PinDetailInsetMapLink to={mapHref} ariaLabel={mapAriaLabel}>
      <PinDetailInsetMap>
        <PinDetailInsetMapCanvas containerRef={containerRef} />
      </PinDetailInsetMap>
    </PinDetailInsetMapLink>
  );
}
