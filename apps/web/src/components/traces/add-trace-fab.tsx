import { FabButton } from "@curolia/ui/fab";
import { Plus, X } from "lucide-react";

type AddTraceFabProps = {
  onClick: () => void;
  active?: boolean;
};

export function AddTraceFab({ onClick, active }: AddTraceFabProps) {
  const title = active ? "Stop adding traces" : "Add trace";

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
      label={active ? "Stop adding" : "Add trace"}
    />
  );
}
