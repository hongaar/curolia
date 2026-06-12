import { pluginList } from "@/plugins/registry";
import {
  isMapOutputToggleablePlugin,
  isPluginOutputShownOnMap,
  type MapPluginOutputShowSettings,
} from "@curolia/plugin-contract";
import { Checkbox } from "@curolia/ui/checkbox";
import { Field, FieldDescription, FieldLabel } from "@curolia/ui/form-layout";
import { Label } from "@curolia/ui/label";
import { PageMuted } from "@curolia/ui/page";
import { useMemo } from "react";

type Props = {
  settings: MapPluginOutputShowSettings;
  onChange: (next: MapPluginOutputShowSettings) => void;
  disabled?: boolean;
};

export function MapShowPluginOutputsField({
  settings,
  onChange,
  disabled = false,
}: Props) {
  const toggleablePlugins = useMemo(
    () => pluginList.filter(isMapOutputToggleablePlugin),
    [],
  );

  if (toggleablePlugins.length === 0) return null;

  return (
    <Field>
      <FieldLabel>Plugin output on pins</FieldLabel>
      <FieldDescription variant="body">
        Choose which plugin cards and subtitles visitors see on your pins.
      </FieldDescription>
      <div>
        {toggleablePlugins.map((plugin) => {
          const checked = isPluginOutputShownOnMap(settings, plugin.id);
          return (
            <Label key={plugin.id}>
              <Checkbox
                checked={checked}
                disabled={disabled}
                onCheckedChange={(value) => {
                  const show = value === true;
                  const next = { ...settings };
                  if (show) {
                    delete next[plugin.id];
                  } else {
                    next[plugin.id] = false;
                  }
                  onChange(next);
                }}
              />
              {plugin.displayName}
            </Label>
          );
        })}
      </div>
      <PageMuted>
        Hiding output does not remove data already attached to pins.
      </PageMuted>
    </Field>
  );
}
