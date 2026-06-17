import { setMapCoverFromPinPhoto } from "@/lib/map-cover";
import { useMapAllPhotosSignedUrls } from "@/lib/use-pin-photos";
import { useAuth } from "@/providers/auth-provider";
import { useMap } from "@/providers/map-provider";
import type { Photo } from "@/types/database";
import { Button } from "@curolia/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@curolia/ui/dialog";
import { PageMuted } from "@curolia/ui/page";
import {
  PhotoGrid,
  PhotoGridPlaceholder,
  PhotoGridThumb,
} from "@curolia/ui/photo-grid";
import { PinPhotoThumb } from "@curolia/ui/pin-photo-lightbox";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type MapCoverPinPhotoPickerProps = {
  mapId: string;
  coverPhotoId: string | null;
  disabled?: boolean;
  onCoverSet: (cover: { url: string; photoId: string }) => void;
  onError?: (message: string) => void;
  onWorkingChange?: (working: boolean) => void;
};

export function MapCoverPinPhotoPicker({
  mapId,
  coverPhotoId,
  disabled = false,
  onCoverSet,
  onError,
  onWorkingChange,
}: MapCoverPinPhotoPickerProps) {
  const { user } = useAuth();
  const { refetch: refetchMaps } = useMap();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const { photos, signedUrlByPhotoId, isLoading } = useMapAllPhotosSignedUrls(
    open ? mapId : undefined,
  );

  const working = Boolean(selectingId);
  const hasPhotos = photos.length > 0;

  async function selectPhoto(photo: Photo) {
    if (selectingId || coverPhotoId === photo.id) return;
    setSelectingId(photo.id);
    onWorkingChange?.(true);
    try {
      const publicUrl = await setMapCoverFromPinPhoto(mapId, photo);
      onCoverSet({ url: publicUrl, photoId: photo.id });
      if (user) {
        await qc.invalidateQueries({ queryKey: ["maps", user.id] });
      }
      await refetchMaps();
      setOpen(false);
    } catch (e) {
      onError?.(
        e instanceof Error ? e.message : "Could not set cover from pin photo.",
      );
    } finally {
      setSelectingId(null);
      onWorkingChange?.(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || working}
        onClick={() => setOpen(true)}
      >
        {working ? "Working…" : "Choose from pin photos"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="wide">
          <DialogHeader>
            <DialogTitle>Choose cover from pin photos</DialogTitle>
            <DialogDescription>
              Pick any photo from your map pins to use as the cover image.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            {isLoading ? (
              <PageMuted>Loading photos…</PageMuted>
            ) : !hasPhotos ? (
              <PageMuted>No pin photos on this map yet.</PageMuted>
            ) : (
              <PhotoGrid>
                {photos.map((photo) => {
                  const url = signedUrlByPhotoId[photo.id];
                  const isCover = coverPhotoId === photo.id;
                  return url ? (
                    <PhotoGridThumb key={photo.id} isCover={isCover}>
                      <PinPhotoThumb
                        url={url}
                        size="square"
                        onOpen={() => void selectPhoto(photo)}
                      />
                    </PhotoGridThumb>
                  ) : (
                    <PhotoGridThumb key={photo.id}>
                      <PhotoGridPlaceholder>…</PhotoGridPlaceholder>
                    </PhotoGridThumb>
                  );
                })}
              </PhotoGrid>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
