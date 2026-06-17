import type { MapViewSegment } from "@/lib/app-paths";
import {
  countEnabledMapViews,
  MAP_VIEW_SEGMENTS,
  type MapViewSettings,
  toggleMapViewEnabled,
} from "@/lib/map-view-settings";
import { Checkbox } from "@curolia/ui/checkbox";
import { ChoiceCard, ChoiceCards } from "@curolia/ui/choice-cards";
import { FieldDescription, FieldLabel } from "@curolia/ui/form-layout";
import { Label } from "@curolia/ui/label";
import { BookOpen, LayoutGrid, Map as MapIcon } from "lucide-react";
import type { ReactNode } from "react";

const VIEW_META: Record<
  MapViewSegment,
  {
    label: string;
    description: string;
    icon: ReactNode;
    tone: "muted" | "green" | "yellow";
  }
> = {
  map: {
    label: "Map",
    description: "Interactive map with pins",
    icon: <MapIcon strokeWidth={1.75} />,
    tone: "muted",
  },
  blog: {
    label: "Blog",
    description: "Chronological pin stories",
    icon: <BookOpen strokeWidth={1.75} />,
    tone: "green",
  },
  gallery: {
    label: "Gallery",
    description: "Photo grid of pins",
    icon: <LayoutGrid strokeWidth={1.75} />,
    tone: "yellow",
  },
};

type MapViewsSettingsFieldProps = {
  value: MapViewSettings;
  onChange: (next: MapViewSettings) => void;
  disabled?: boolean;
};

export function MapViewsSettingsField({
  value,
  onChange,
  disabled = false,
}: MapViewsSettingsFieldProps) {
  return (
    <>
      <FieldLabel id="map-views-label">Views</FieldLabel>
      <ChoiceCards<MapViewSegment>
        name="map-views"
        value={value.defaultView}
        onValueChange={(view) =>
          onChange({
            defaultView: view,
            enabled: { ...value.enabled, [view]: true },
          })
        }
        disabled={disabled}
        aria-labelledby="map-views-label"
      >
        {MAP_VIEW_SEGMENTS.map((view) => {
          const meta = VIEW_META[view];
          const enabled = value.enabled[view];
          const onlyEnabledView =
            enabled && countEnabledMapViews(value.enabled) === 1;

          return (
            <ChoiceCard
              key={view}
              value={view}
              label={meta.label}
              description={meta.description}
              previewIcon={meta.icon}
              previewTone={meta.tone}
              footer={
                <MapViewEnabledCheckbox
                  label="Enabled"
                  checked={enabled}
                  disabled={disabled || onlyEnabledView}
                  onCheckedChange={(checked) =>
                    onChange(toggleMapViewEnabled(value, view, checked))
                  }
                />
              }
            />
          );
        })}
      </ChoiceCards>
      <FieldDescription>
        Choose the default view and turn individual views on or off. At least
        one view must stay enabled.
      </FieldDescription>
    </>
  );
}

function MapViewEnabledCheckbox({
  label,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <Label>
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(next) => onCheckedChange(next === true)}
      />
      {label}
    </Label>
  );
}
