import { EmojiFieldPicker } from "@curolia/ui/picker";

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
