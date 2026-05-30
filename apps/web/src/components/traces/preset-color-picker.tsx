import { PRESET_TRACE_TAG_COLOR_GRID } from "@/lib/preset-trace-tag-colors";
import { PresetColorPicker as UiPresetColorPicker } from "@curolia/ui/curolia/picker-ui";

type PresetColorPickerProps = {
  id?: string;
  label: string;
  value: string;
  onChange: (hex: string) => void;
};

export function PresetColorPicker(props: PresetColorPickerProps) {
  return (
    <UiPresetColorPicker {...props} colors={PRESET_TRACE_TAG_COLOR_GRID} />
  );
}
