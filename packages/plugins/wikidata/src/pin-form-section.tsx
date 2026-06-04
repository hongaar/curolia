import type { PinContextProps } from "@curolia/plugin-contract";
import { PluginPinMuted } from "@curolia/ui/plugin-pin";
import { useWikidataPluginReady } from "./use-wikidata-plugin-ready";
import { WikidataPinFormEditor } from "./wikidata-pin-form-editor";

/** Card header (icon + name) is provided by the pin editor shell. */
export function WikidataPinFormSection({
  supabase,
  userId,
  mapId,
  pinId,
  pinLat,
  pinLng,
}: PinContextProps) {
  const { pluginReady } = useWikidataPluginReady(supabase, { userId, mapId });

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
        Set coordinates to choose a nearby Wikipedia article.
      </PluginPinMuted>
    );
  }

  return (
    <WikidataPinFormEditor
      supabase={supabase}
      pinId={pinId}
      lat={lat}
      lng={lng}
    />
  );
}
