import { useMaxSm } from "@/hooks/use-max-sm";
import { pinEditHref } from "@/lib/app-paths";
import { mapRouteForMap } from "@/lib/map-route";
import { useMap } from "@/providers/map-provider";
import type { Pin } from "@/types/database";
import { Button } from "@curolia/ui/button";
import { Pencil } from "lucide-react";
import { lazy, Suspense, useMemo, useState, type ComponentProps } from "react";
import { Link } from "react-router-dom";

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

/** Opens pin editor — navigates on mobile, dialog on wider viewports. */
export function PinFormDialogTrigger({
  mapId,
  pin,
  label = "Edit",
  variant = "outline",
  size = "sm",
}: PinFormDialogTriggerProps) {
  const isMobile = useMaxSm();
  const { maps } = useMap();
  const [dialogOpen, setDialogOpen] = useState(false);

  const mapRoute = useMemo(() => {
    const map = maps.find((m) => m.id === mapId);
    return map ? mapRouteForMap(map) : null;
  }, [maps, mapId]);

  const editHref =
    mapRoute && pin.slug.trim() ? pinEditHref(mapRoute, pin.slug) : null;

  if (isMobile && editHref) {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        render={<Link to={editHref} />}
      >
        <Pencil aria-hidden />
        {label}
      </Button>
    );
  }

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
