import { PRESET_PIN_TAG_COLOR_GRID } from "@/lib/preset-pin-tag-colors";
import { PresetColorPicker as UiPresetColorPicker } from "@curolia/ui/picker";

type PresetColorPickerProps = {
  id?: string;
  label: string;
  value: string;
  onChange: (hex: string) => void;
};

export function PresetColorPicker(props: PresetColorPickerProps) {
  return <UiPresetColorPicker {...props} colors={PRESET_PIN_TAG_COLOR_GRID} />;
}
