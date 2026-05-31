import type { TraceMapHandle } from "@/components/map/trace-map";
import { MapToolbar, MapToolbarButton } from "@curolia/ui/map-toolbar";
import { Locate, Minus, Plus, Scan } from "lucide-react";
import type { RefObject } from "react";

export function MapControlsToolbar({
  mapRef,
}: {
  mapRef: RefObject<TraceMapHandle | null>;
}) {
  return (
    <MapToolbar>
      <MapToolbarButton
        icon={<Scan aria-hidden />}
        label="Fit traces"
        title="Fit map to visible traces"
        onClick={() => mapRef.current?.fitVisibleTraces()}
      />
      <MapToolbarButton
        icon={<Plus aria-hidden />}
        label="Zoom in"
        onClick={() => mapRef.current?.zoomIn()}
      />
      <MapToolbarButton
        icon={<Minus aria-hidden />}
        label="Zoom out"
        onClick={() => mapRef.current?.zoomOut()}
      />
      <MapToolbarButton
        icon={<Locate aria-hidden />}
        label="My location"
        onClick={() => mapRef.current?.triggerGeolocate()}
      />
    </MapToolbar>
  );
}
