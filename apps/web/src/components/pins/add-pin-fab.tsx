import { FabButton } from "@curolia/ui/fab";
import { Plus } from "lucide-react";
import { forwardRef } from "react";

type AddPinFabProps = {
  onClick: () => void;
};

export const AddPinFab = forwardRef<HTMLButtonElement, AddPinFabProps>(
  function AddPinFab({ onClick }, ref) {
    return (
      <FabButton
        ref={ref}
        title="Add pin"
        onClick={onClick}
        icon={<Plus strokeWidth={2.25} aria-hidden />}
      />
    );
  },
);
