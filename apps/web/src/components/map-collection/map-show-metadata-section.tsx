import {
  PIN_METADATA_SHOW_GROUPS,
  pinMetadataFieldLabel,
  pinMetadataShowSelectItems,
  pinMetadataShowSelectSummary,
  type PinMetadataShowFieldKey,
  type PinMetadataShowSettings,
} from "@curolia/plugin-contract";
import { FormField, FormSelectTriggerFull } from "@curolia/ui/form-layout";
import { Label } from "@curolia/ui/label";
import { PageMuted } from "@curolia/ui/page";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectValue,
} from "@curolia/ui/select";
import { useMemo } from "react";

const SHOW_METADATA_ITEMS = pinMetadataShowSelectItems();

type Props = {
  mapId: string;
  settings: PinMetadataShowSettings;
  onChange: (next: PinMetadataShowSettings) => void;
  disabled?: boolean;
};

export function MapShowMetadataField({
  mapId,
  settings,
  onChange,
  disabled = false,
}: Props) {
  const selectId = `map-show-metadata-${mapId}`;

  const value = useMemo(
    () => [...settings] as PinMetadataShowFieldKey[],
    [settings],
  );

  return (
    <FormField>
      <Label id={selectId}>Show metadata</Label>
      <PageMuted>Choose which place information to show on pins.</PageMuted>
      <Select
        multiple
        disabled={disabled}
        value={value}
        onValueChange={(next) => onChange(next ?? [])}
        items={SHOW_METADATA_ITEMS}
      >
        <FormSelectTriggerFull aria-labelledby={selectId}>
          <SelectValue placeholder="No metadata shown">
            {(selected) => pinMetadataShowSelectSummary(selected)}
          </SelectValue>
        </FormSelectTriggerFull>
        <SelectContent alignItemWithTrigger>
          {PIN_METADATA_SHOW_GROUPS.map((group) => (
            <SelectGroup key={group.label}>
              <SelectLabel>{group.label}</SelectLabel>
              {group.keys.map((key) => (
                <SelectItem key={key} value={key}>
                  {pinMetadataFieldLabel(key)}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}
