import type { PinContextProps } from "@curolia/plugin-contract";
import { PluginPinMuted } from "@curolia/ui/plugin-pin";
import { OsmPoiPinFormEditor } from "./osm-poi-pin-form-editor";
import { useOsmPoiPluginReady } from "./use-osm-poi-plugin-ready";

/** Card header (icon + name) is provided by the pin editor shell. */
export function OsmPoiPinFormSection({
  supabase,
  mapId,
  pinId,
  pinLat,
  pinLng,
}: PinContextProps) {
  const { pluginReady } = useOsmPoiPluginReady(supabase, { mapId });

  const lat = pinLat ?? null;
  const lng = pinLng ?? null;
  const hasCoords =
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng);

  if (!pluginReady) return null;

  if (!hasCoords) {
    return (
      <PluginPinMuted>
        Set coordinates to link an OpenStreetMap place.
      </PluginPinMuted>
    );
  }

  return (
    <OsmPoiPinFormEditor
      supabase={supabase}
      pinId={pinId}
      lat={lat}
      lng={lng}
    />
  );
}
