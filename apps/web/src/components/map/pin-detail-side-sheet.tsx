import { PinDetailBody, type PinRow } from "@/components/pins/pin-detail-body";
import type { MapRoute } from "@/lib/map-route";
import { supabase } from "@/lib/supabase";
import { usePinPhotosSignedUrls } from "@/lib/use-pin-photos";
import { Button } from "@curolia/ui/button";
import { useQuery } from "@tanstack/react-query";
import { XIcon } from "lucide-react";

interface PinDetailSideSheetProps {
  pinId: string;
  mapId: string;
  mapRoute: MapRoute | null;
  onClose: () => void;
}

export function PinDetailSideSheet({
  pinId,
  mapRoute,
  onClose,
}: PinDetailSideSheetProps) {
  const pinQuery = useQuery({
    queryKey: ["pin-side-sheet", pinId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pins")
        .select(
          `*,
          pin_tags ( tag_id, tags ( id, name, color, icon_emoji ) ),
          creator:profiles!pins_created_by_user_id_fkey ( display_name ),
          modifier:profiles!pins_modified_by_user_id_fkey ( display_name )`,
        )
        .eq("id", pinId)
        .maybeSingle();
      if (error) throw error;
      return data as PinRow | null;
    },
    enabled: Boolean(pinId),
  });

  const pin = pinQuery.data;
  const { photos, signedUrlByPhotoId } = usePinPhotosSignedUrls(pin?.id);

  if (pinQuery.isLoading || !pin) {
    return null;
  }

  return (
    <PinDetailBody
      pin={pin}
      photos={photos}
      signedUrlByPhotoId={signedUrlByPhotoId}
      permalinkMapRoute={mapRoute ?? undefined}
      extraActions={
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Close pin details"
          onClick={onClose}
        >
          <XIcon />
        </Button>
      }
    />
  );
}
