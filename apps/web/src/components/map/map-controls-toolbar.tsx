import { LocateFixed, Minus, Plus, Scan } from "lucide-react";
import type { TraceMapHandle } from "@/components/map/trace-map";
import {
  MapToolbarGroup,
  MapToolbarIconButton,
} from "@/components/map/map-toolbar";
import type { RefObject } from "react";

type MapControlsToolbarProps = {
  mapRef: RefObject<TraceMapHandle | null>;
};

export function MapControlsToolbar({ mapRef }: MapControlsToolbarProps) {
  return (
    <MapToolbarGroup>
      <MapToolbarIconButton
        icon={<Scan />}
        label="Fit traces"
        title="Fit map to visible traces"
        onClick={() => mapRef.current?.fitVisibleTraces()}
      />
      <MapToolbarIconButton
        icon={<Plus />}
        label="Zoom in"
        onClick={() => mapRef.current?.zoomIn()}
      />
      <MapToolbarIconButton
        icon={<Minus />}
        label="Zoom out"
        onClick={() => mapRef.current?.zoomOut()}
      />
      <MapToolbarIconButton
        icon={<LocateFixed />}
        label="My location"
        title="Find my location"
        onClick={() => mapRef.current?.triggerGeolocate()}
      />
    </MapToolbarGroup>
  );
}
