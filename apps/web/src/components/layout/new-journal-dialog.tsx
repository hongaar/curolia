import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@curolia/ui/button";
import { Dialog, DialogFooter, DialogHeader } from "@curolia/ui/dialog";
import {
  PanelDialogContent,
  PanelDialogField,
  PanelDialogFormStack,
  PanelDialogTitle,
} from "@curolia/ui/curolia/panel-dialog";
import { Input } from "@curolia/ui/input";
import { Label } from "@curolia/ui/label";
import { EmojiPicker } from "@/components/traces/emoji-picker";
import { journalViewHref } from "@/lib/app-paths";
import { useJournal } from "@/providers/journal-provider";
import { defaultJournalIcon } from "@/lib/journal-display-icon";

type NewJournalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewJournalDialog({
  open,
  onOpenChange,
}: NewJournalDialogProps) {
  const navigate = useNavigate();
  const { createJournal } = useJournal();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(() => defaultJournalIcon(false));
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    const { journal, error } = await createJournal(name.trim(), icon);
    setCreating(false);
    if (!error && journal?.slug) {
      onOpenChange(false);
      navigate(journalViewHref("map", journal.slug));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setName("");
          setIcon(defaultJournalIcon(false));
        }
      }}
    >
      <PanelDialogContent>
        <DialogHeader>
          <PanelDialogTitle>New journal</PanelDialogTitle>
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
