import { FabButton } from "@curolia/ui/fab";
import { Plus, X } from "lucide-react";

type AddPinFabProps = {
  onClick: () => void;
  active?: boolean;
};

export function AddPinFab({ onClick, active }: AddPinFabProps) {
  const title = active ? "Stop adding pins" : "Add pin";

  return (
    <FabButton
      active={active}
      title={title}
      onClick={onClick}
      icon={
        active ? (
          <X strokeWidth={2.25} aria-hidden />
        ) : (
          <Plus strokeWidth={2.25} aria-hidden />
        )
      }
      label={active ? "Stop adding" : "Add pin"}
    />
  );
}
