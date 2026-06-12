import { PinDetailBody, type PinRow } from "@/components/pins/pin-detail-body";
import type { MapRoute } from "@/lib/map-route";
import type { PinWithTags } from "@/lib/pin-with-tags";
import { supabase } from "@/lib/supabase";
import { usePinPhotosSignedUrls } from "@/lib/use-pin-photos";
import { useBottomSheetDismiss } from "@curolia/ui/bottom-sheet";
import { Button } from "@curolia/ui/button";
import { useQuery } from "@tanstack/react-query";
import { XIcon } from "lucide-react";

import styles from "./pin-detail-side-sheet.module.css";

interface PinDetailSideSheetProps {
  pinId: string;
  mapId: string;
  mapRoute: MapRoute | null;
  mapPins: PinWithTags[];
  onNavigatePin: (pinId: string) => void;
  onClose: () => void;
  /** Mobile bottom sheet layout on the map. */
  bottomSheet?: boolean;
}

export function pinDetailSideSheetTitle(
  pin: Pick<PinWithTags, "title"> | null | undefined,
): string {
  return pin?.title?.trim() || "Pin details";
}

export function PinDetailSideSheet({
  pinId,
  mapRoute,
  mapPins,
  onNavigatePin,
  onClose,
  bottomSheet = false,
}: PinDetailSideSheetProps) {
  const dismissBottomSheet = useBottomSheetDismiss();
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

  const body = (
    <PinDetailBody
      pin={pin}
      photos={photos}
      signedUrlByPhotoId={signedUrlByPhotoId}
      permalinkMapRoute={mapRoute ?? undefined}
      mapPins={mapPins}
      onNavigateSequencePin={(target) => onNavigatePin(target.id)}
      sideSheet
      bottomSheet={bottomSheet}
      extraActions={
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Close pin details"
          onClick={() => {
            if (bottomSheet && dismissBottomSheet) {
              dismissBottomSheet();
              return;
            }
            onClose();
          }}
        >
          <XIcon />
        </Button>
      }
    />
  );

  if (bottomSheet) {
    return <div className={styles.bottomSheetInner}>{body}</div>;
  }

  return body;
}
