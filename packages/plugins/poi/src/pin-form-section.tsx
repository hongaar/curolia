import type { PinContextProps } from "@curolia/plugin-contract";
import { PluginPinMuted } from "@curolia/ui/plugin-pin";
import { PoiPinFormEditor } from "./poi-pin-form-editor";
import { usePoiPluginReady } from "./use-poi-plugin-ready";

/** Card header (icon + name) is provided by the pin editor shell. */
export function PoiPinFormSection({
  supabase,
  userId,
  mapId,
  pinId,
  pinLat,
  pinLng,
}: PinContextProps) {
  const { pluginReady } = usePoiPluginReady(supabase, { userId, mapId });

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
      <PluginPinMuted>Set coordinates to link a nearby place.</PluginPinMuted>
    );
  }

  return (
    <PoiPinFormEditor supabase={supabase} pinId={pinId} lat={lat} lng={lng} />
  );
}
