import { PRESET_PIN_TAG_COLOR_GRID } from "@/lib/preset-pin-tag-colors";
import { EntityLabelInput } from "@curolia/ui/entity-label-input";
import type { ComponentProps } from "react";

type TagEntityLabelInputProps = Omit<
  ComponentProps<typeof EntityLabelInput>,
  "colors" | "onColorChange" | "color"
> & {
  color: string;
  onColorChange: (hex: string) => void;
};

export function TagEntityLabelInput(props: TagEntityLabelInputProps) {
  return <EntityLabelInput {...props} colors={PRESET_PIN_TAG_COLOR_GRID} />;
}
