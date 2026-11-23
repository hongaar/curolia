import {
  CHANGELOG_QUERY_KEY,
  IS_APP_ADMIN_QUERY_KEY,
  deleteChangelogEntry,
  fetchChangelogEntries,
  fetchIsAppAdmin,
  formatChangelogDate,
  saveChangelogEntry,
  uploadChangelogImage,
  type ChangelogEntry,
} from "@/lib/changelog";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@curolia/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogFooterEnd,
  DialogFooterStart,
  DialogFormStack,
  DialogHeader,
  DialogTitle,
} from "@curolia/ui/dialog";
import { Field, FieldControl, FieldLabel } from "@curolia/ui/field";
import {
  FileUploadInput,
  FileUploadLabel,
  FileUploadRow,
} from "@curolia/ui/file-upload";
import {
  HomeFeedChangelog,
  HomeFeedChangelogItem,
  HomeFeedMapListEmpty,
} from "@curolia/ui/home-feed";
import { Input } from "@curolia/ui/input";
import { Textarea } from "@curolia/ui/textarea";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function todayIsoDate(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

type EditorState = { entry: ChangelogEntry | null } | null;

export function HomeChangelog() {
  const [editor, setEditor] = useState<EditorState>(null);

  const entriesQuery = useQuery({
    queryKey: CHANGELOG_QUERY_KEY,
    queryFn: () => fetchChangelogEntries(),
  });
  const { user } = useAuth();
  const adminQuery = useQuery({
    queryKey: [...IS_APP_ADMIN_QUERY_KEY, user?.id],
    queryFn: fetchIsAppAdmin,
    staleTime: Infinity,
    enabled: Boolean(user),
  });
  const isAdmin = adminQuery.data === true;
  const entries = entriesQuery.data ?? [];

  return (
    <>
      <HomeFeedChangelog
        title="What's new"
        action={
          isAdmin ? (
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="Add changelog entry"
              onClick={() => setEditor({ entry: null })}
            >
              <Plus aria-hidden />
            </Button>
          ) : undefined
        }
        empty={
          <HomeFeedMapListEmpty>
            {entriesQuery.isLoading ? "Loading…" : "No updates yet."}
          </HomeFeedMapListEmpty>
        }
      >
        {entries.map((entry) => (
          <HomeFeedChangelogItem
            key={entry.id}
            date={formatChangelogDate(entry.published_on)}
            imageUrl={entry.image_url}
            actions={
              isAdmin ? (
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Edit changelog entry"
                  onClick={() => setEditor({ entry })}
                >
                  <Pencil aria-hidden />
                </Button>
              ) : undefined
            }
          >
            {entry.description}
          </HomeFeedChangelogItem>
        ))}
      </HomeFeedChangelog>
      {editor ? (
        <ChangelogEntryDialog
          key={editor.entry?.id ?? "new"}
          entry={editor.entry}
          onClose={() => setEditor(null)}
        />
      ) : null}
    </>
  );
}

function ChangelogEntryDialog({
  entry,
  onClose,
}: {
  entry: ChangelogEntry | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [publishedOn, setPublishedOn] = useState(
    entry?.published_on ?? todayIsoDate(),
  );
  const [description, setDescription] = useState(entry?.description ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(
    entry?.image_url ?? null,
  );
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>, success: string) {
    setBusy(true);
    try {
      await action();
      await qc.invalidateQueries({ queryKey: CHANGELOG_QUERY_KEY });
      toast.success(success);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function onImageSelected(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      setImageUrl(await uploadChangelogImage(file));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  const canSave = Boolean(description.trim() && publishedOn) && !busy;

  return (
    <Dialog open onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {entry ? "Edit changelog entry" : "New changelog entry"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogFormStack>
            <Field>
              <FieldLabel htmlFor="changelog-date">Date</FieldLabel>
              <FieldControl>
                <Input
                  id="changelog-date"
                  type="date"
                  value={publishedOn}
                  onChange={(e) => setPublishedOn(e.target.value)}
                />
              </FieldControl>
            </Field>
            <Field>
              <FieldLabel htmlFor="changelog-description">
                Description
              </FieldLabel>
              <FieldControl>
                <Textarea
                  id="changelog-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </FieldControl>
            </Field>
            {imageUrl ? (
              <HomeFeedChangelog title="Image">
                <HomeFeedChangelogItem
                  date="Preview"
                  imageUrl={imageUrl}
                  actions={
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      aria-label="Remove image"
                      onClick={() => setImageUrl(null)}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  }
                >
                  {null}
                </HomeFeedChangelogItem>
              </HomeFeedChangelog>
            ) : null}
            <FileUploadRow>
              <FileUploadLabel
                input={
                  <FileUploadInput
                    type="file"
                    accept="image/*"
                    disabled={busy}
                    onChange={(e) => void onImageSelected(e.target.files?.[0])}
                  />
                }
              >
                <ImagePlus aria-hidden />
                <span>{imageUrl ? "Replace image" : "Add image"}</span>
              </FileUploadLabel>
            </FileUploadRow>
          </DialogFormStack>
        </DialogBody>
        <DialogFooter between={Boolean(entry)}>
          {entry ? (
            <DialogFooterStart>
              <Button
                variant="destructive"
                disabled={busy}
                onClick={() =>
                  void run(
                    () => deleteChangelogEntry(entry.id),
                    "Entry deleted",
                  )
                }
              >
                Delete
              </Button>
            </DialogFooterStart>
          ) : null}
          <DialogFooterEnd>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={!canSave}
              onClick={() =>
                void run(
                  () =>
                    saveChangelogEntry(entry?.id ?? null, {
                      published_on: publishedOn,
                      description: description.trim(),
                      image_url: imageUrl,
                    }),
                  entry ? "Entry updated" : "Entry added",
                )
              }
            >
              Save
            </Button>
          </DialogFooterEnd>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
