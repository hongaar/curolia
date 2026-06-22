import { CategoryChipControl } from "@curolia/ui/category-chips";
import { Settings } from "lucide-react";

export function MapQuickSettingsTrigger({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <CategoryChipControl
      aria-label="Map settings"
      title="Map settings"
      active={open}
      aria-pressed={open}
      onClick={onClick}
    >
      <Settings aria-hidden />
    </CategoryChipControl>
  );
}
