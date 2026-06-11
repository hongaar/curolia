import { PinContextMenuTagsSubmenu } from "@/components/map/pin-context-menu-tags-submenu";
import type { Tag } from "@/types/database";
import { Button } from "@curolia/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@curolia/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@curolia/ui/dropdown-menu";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export type MapPointerContextMenuTarget =
  | {
      type: "map";
      lng: number;
      lat: number;
      zoom: number;
      x: number;
      y: number;
    }
  | { type: "pin"; pinId: string; x: number; y: number };

type MapPointerContextMenuProps = {
  target: MapPointerContextMenuTarget | null;
  onTargetChange: (target: MapPointerContextMenuTarget | null) => void;
  canEdit?: boolean;
  tags: Tag[];
  pinTagIdsFor: (pinId: string) => Set<string>;
  onTogglePinTag: (
    pinId: string,
    tagId: string,
    checked: boolean,
  ) => void | Promise<void>;
  onAddPinAt: (lng: number, lat: number, zoom: number) => void;
  onOpenPin: (pinId: string) => void;
  onEditPin: (pinId: string) => void;
  onMoveMarker: (pinId: string) => void;
  onRemovePin: (pinId: string) => void | Promise<void>;
};

export function MapPointerContextMenu({
  target,
  onTargetChange,
  canEdit = true,
  tags,
  pinTagIdsFor,
  onTogglePinTag,
  onAddPinAt,
  onOpenPin,
  onEditPin,
  onMoveMarker,
  onRemovePin,
}: MapPointerContextMenuProps) {
  const [deletePinId, setDeletePinId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [tagToggleBusy, setTagToggleBusy] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const prevTargetRef = useRef<MapPointerContextMenuTarget | null>(null);

  // Open the menu by imperatively clicking the hidden trigger whenever a new
  // target is set. Using a real trigger (rather than a controlled open + virtual
  // anchor) lets Base UI properly track the menu lifecycle so submenus work.
  useEffect(() => {
    const prev = prevTargetRef.current;
    prevTargetRef.current = target;
    if (target && !prev) {
      triggerRef.current?.click();
    }
  }, [target]);

  async function confirmRemove() {
    if (!deletePinId || deleting) return;
    setDeleting(true);
    try {
      await onRemovePin(deletePinId);
      setDeletePinId(null);
      onTargetChange(null);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not delete this pin.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <DropdownMenu
        modal={false}
        onOpenChange={(open) => {
          if (!open) onTargetChange(null);
        }}
      >
        {/* Zero-size hidden trigger positioned at the right-click/long-press point.
            A real DOM trigger is required so Base UI correctly tracks the menu
            open state and submenus open on hover without closing the parent. */}
        <DropdownMenuTrigger
          ref={triggerRef}
          tabIndex={-1}
          aria-hidden
          style={{
            position: "fixed",
            left: target?.x ?? -9999,
            top: target?.y ?? -9999,
            width: 0,
            height: 0,
            padding: 0,
            border: "none",
            outline: "none",
            background: "none",
            overflow: "hidden",
            pointerEvents: "none",
          }}
        />
        <DropdownMenuContent side="right" align="start" sideOffset={4}>
          {canEdit && target?.type === "map" ? (
            <DropdownMenuItem
              onClick={() => {
                onAddPinAt(target.lng, target.lat, target.zoom);
                onTargetChange(null);
              }}
            >
              Add pin
            </DropdownMenuItem>
          ) : null}
          {target?.type === "pin" ? (
            <>
              <DropdownMenuItem
                onClick={() => {
                  onOpenPin(target.pinId);
                  onTargetChange(null);
                }}
              >
                Open
              </DropdownMenuItem>
              {canEdit ? (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      onEditPin(target.pinId);
                      onTargetChange(null);
                    }}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      onMoveMarker(target.pinId);
                      onTargetChange(null);
                    }}
                  >
                    Move marker
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Set tags</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <PinContextMenuTagsSubmenu
                        tags={tags}
                        selectedTagIds={pinTagIdsFor(target.pinId)}
                        disabled={tagToggleBusy}
                        onToggleTag={(tagId, checked) => {
                          setTagToggleBusy(true);
                          void Promise.resolve(
                            onTogglePinTag(target.pinId, tagId, checked),
                          )
                            .catch((e) => {
                              toast.error(
                                e instanceof Error
                                  ? e.message
                                  : "Could not update tags.",
                              );
                            })
                            .finally(() => setTagToggleBusy(false));
                        }}
                      />
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      setDeletePinId(target.pinId);
                      onTargetChange(null);
                    }}
                  >
                    Remove
                  </DropdownMenuItem>
                </>
              ) : null}
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={deletePinId !== null}
        onOpenChange={(open) => {
          if (!open && deleting) return;
          if (!open) setDeletePinId(null);
        }}
      >
        <DialogContent>
          <DialogHeader showCloseButton={!deleting}>
            <DialogTitle>Delete pin?</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogDescription>
              This removes the pin from your map. This cannot be undone.
            </DialogDescription>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setDeletePinId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => void confirmRemove()}
            >
              {deleting ? "Deleting…" : "Delete pin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
