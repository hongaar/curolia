import { mapViewHref } from "@/lib/app-paths";
import { defaultMapIcon } from "@/lib/map-display-icon";
import { useMap } from "@/providers/map-provider";
import { Button } from "@curolia/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogFormStack,
  DialogHeader,
  DialogTitle,
} from "@curolia/ui/dialog";
import { EntityLabelInput } from "@curolia/ui/entity-label-input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type NewMapDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewMapDialog({ open, onOpenChange }: NewMapDialogProps) {
  const navigate = useNavigate();
  const { createMap } = useMap();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(() => defaultMapIcon());
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    const { map, error } = await createMap(name.trim(), icon);
    setCreating(false);
    if (!error && map?.slug) {
      onOpenChange(false);
      navigate(mapViewHref("map", map.slug));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setName("");
          setIcon(defaultMapIcon());
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New map</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogFormStack>
            <EntityLabelInput
              id="jn"
              label="Map"
              name={name}
              onNameChange={setName}
              placeholder="Family trips"
              emoji={icon}
              onEmojiChange={setIcon}
              emojiFallback={defaultMapIcon()}
            />
          </DialogFormStack>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={creating} onClick={() => void handleCreate()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
