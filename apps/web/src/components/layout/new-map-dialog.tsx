import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@curolia/ui/button";
import { Dialog, DialogFooter, DialogHeader } from "@curolia/ui/dialog";
import {
  PanelDialogContent,
  PanelDialogField,
  PanelDialogFormStack,
  PanelDialogTitle,
} from "@curolia/ui/panel-dialog";
import { Input } from "@curolia/ui/input";
import { Label } from "@curolia/ui/label";
import { EmojiPicker } from "@/components/pins/emoji-picker";
import { mapViewHref } from "@/lib/app-paths";
import { useMap } from "@/providers/map-provider";
import { defaultMapIcon } from "@/lib/map-display-icon";

type NewMapDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewMapDialog({ open, onOpenChange }: NewMapDialogProps) {
  const navigate = useNavigate();
  const { createMap } = useMap();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(() => defaultMapIcon(false));
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
          setIcon(defaultMapIcon(false));
        }
      }}
    >
      <PanelDialogContent>
        <DialogHeader>
          <PanelDialogTitle>New map</PanelDialogTitle>
        </DialogHeader>
        <PanelDialogFormStack>
          <PanelDialogField>
            <Label htmlFor="jn">Name</Label>
            <Input
              id="jn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Family trips"
            />
          </PanelDialogField>
          <EmojiPicker
            id="jn-icon"
            label="Icon"
            value={icon}
            onChange={setIcon}
          />
        </PanelDialogFormStack>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={creating} onClick={() => void handleCreate()}>
            Create
          </Button>
        </DialogFooter>
      </PanelDialogContent>
    </Dialog>
  );
}
