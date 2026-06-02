import type { Pin } from "@/types/database";
import { Button } from "@curolia/ui/button";
import { Pencil } from "lucide-react";
import { lazy, Suspense, useState, type ComponentProps } from "react";

const PinFormDialog = lazy(() =>
  import("@/components/pins/pin-form-dialog").then((m) => ({
    default: m.PinFormDialog,
  })),
);

type PinFormDialogTriggerProps = {
  mapId: string;
  pin: Pin;
  label?: string;
} & Pick<ComponentProps<typeof Button>, "variant" | "size">;

/** Opens {@link PinFormDialog} — use instead of an external Edit control. */
export function PinFormDialogTrigger({
  mapId,
  pin,
  label = "Edit",
  variant = "outline",
  size = "sm",
}: PinFormDialogTriggerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setDialogOpen(true)}
      >
        <Pencil aria-hidden />
        {label}
      </Button>
      {dialogOpen ? (
        <Suspense fallback={null}>
          <PinFormDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            mapId={mapId}
            pin={pin}
          />
        </Suspense>
      ) : null}
    </>
  );
}
