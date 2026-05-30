import { EmojiFieldPicker } from "@curolia/ui/curolia/picker-ui";

type EmojiPickerProps = {
  id?: string;
  label: string;
  value: string;
  onChange: (emoji: string) => void;
  disabled?: boolean;
};

export function EmojiPicker(props: EmojiPickerProps) {
  return <EmojiFieldPicker {...props} />;
}
