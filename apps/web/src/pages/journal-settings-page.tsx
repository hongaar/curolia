import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import { useJournal } from "@/providers/journal-provider";
import { PageBackButton } from "@/components/layout/page-back-button";
import { Button } from "@curolia/ui/button";
import { Input } from "@curolia/ui/input";
import { Label } from "@curolia/ui/label";
import { EmojiPicker } from "@/components/traces/emoji-picker";
import {
  defaultJournalIcon,
  normalizeJournalIconForPersist,
} from "@/lib/journal-display-icon";
import { journalViewHref } from "@/lib/app-paths";
import { JournalSharingSection } from "@/components/journal/journal-sharing-section";
import { JournalPluginsSection } from "@/components/journal/journal-plugins-section";
import {
  AppPageLayout,
  PageCenteredLoading,
  PageDisplayTitle,
  PageErrorText,
  PageFormBlockSpaced,
  PageInlineActions,
  PageLead,
  PageMuted,
  PagePanel,
} from "@curolia/ui/curolia/page";
import { FormField } from "@curolia/ui/curolia/form-layout";

export function JournalSettingsPage() {
  const { journalId } = useParams<{ journalId: string }>();
  const { user } = useAuth();
  const { journals, activeJournalId, setActiveJournalId } = useJournal();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [iconEmoji, setIconEmoji] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const journal = useMemo(
    () => journals.find((j) => j.id === journalId) ?? null,
    [journals, journalId],
  );

  const roleQuery = useQuery({
    queryKey: ["journal_member_role", journalId, user?.id],
    queryFn: async () => {
      if (!journalId || !user) return null;
      const { data, error: err } = await supabase
        .from("journal_members")
        .select("role")
        .eq("journal_id", journalId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (err) throw err;
      return data?.role ?? null;
    },
    enabled: Boolean(journalId && user),
  });

  const isOwner = roleQuery.data === "owner";

  useEffect(() => {
    if (!journal) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset field when switching journal
    setName(journal.name);
    setIconEmoji(journal.icon_emoji ?? defaultJournalIcon(journal.is_personal));
  }, [journal]);

  async function save() {
    if (!journalId || !journal || !name.trim()) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("journals")
      .update({
        name: name.trim(),
        icon_emoji: normalizeJournalIconForPersist(
          iconEmoji,
          journal.is_personal,
        ),
        updated_at: new Date().toISOString(),
      })
      .eq("id", journalId);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (user) await qc.invalidateQueries({ queryKey: ["journals", user.id] });
  }

  if (!journalId) {
    return <PageCenteredLoading>Missing journal.</PageCenteredLoading>;
  }

  if (!journal) {
    return (
      <AppPageLayout>
        <PageBackButton />
        <PagePanel>
          <PageMuted>
            You do not have access to this journal or it does not exist.
          </PageMuted>
          <PageInlineActions spaced="tight">
            <Button
              variant="outline"
              size="sm"
              render={
                <Link
                  to={
                    journals[0]?.slug
                      ? journalViewHref("map", journals[0].slug)
                      : "/"
                  }
                />
              }
            >
              Back to map
            </Button>
          </PageInlineActions>
        </PagePanel>
      </AppPageLayout>
    );
  }

  const nameDirty = name.trim() !== journal.name;
  const iconToSave = normalizeJournalIconForPersist(
    iconEmoji,
    journal.is_personal,
  );
  const iconDirty = iconToSave !== (journal.icon_emoji ?? null);
  const canSave =
    isOwner && Boolean(name.trim()) && (nameDirty || iconDirty) && !saving;

  return (
    <AppPageLayout>
      <PageBackButton />
      <PagePanel>
        <PageDisplayTitle>Journal settings</PageDisplayTitle>
        <PageLead>More options will land here later.</PageLead>

        <PageFormBlockSpaced>
          {!isOwner && !roleQuery.isLoading ? (
            <PageMuted>
              Only owners can change the journal name or icon.
            </PageMuted>
          ) : null}
          <FormField>
            <Label htmlFor="jn-name">Journal name</Label>
            <Input
              id="jn-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isOwner || roleQuery.isLoading}
            />
          </FormField>
          <EmojiPicker
            id="jn-settings-icon"
            label="Icon"
            value={iconEmoji}
            onChange={setIconEmoji}
            disabled={!isOwner || roleQuery.isLoading}
          />
          {error ? <PageErrorText>{error}</PageErrorText> : null}
          <PageInlineActions>
            <Button disabled={!canSave} onClick={() => void save()}>
              Save
            </Button>
            {activeJournalId !== journalId ? (
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setActiveJournalId(journalId);
                  const slug = journal.slug.trim();
                  navigate(slug ? journalViewHref("map", slug) : "/");
                }}
              >
                Switch to this journal
              </Button>
            ) : null}
          </PageInlineActions>
        </PageFormBlockSpaced>
      </PagePanel>

      <JournalPluginsSection
        journalId={journalId}
        isOwner={isOwner}
        roleLoading={roleQuery.isLoading}
      />

      <PagePanel>
        <JournalSharingSection
          journalId={journalId}
          journalName={journal.name}
          isOwner={isOwner}
        />
      </PagePanel>
    </AppPageLayout>
  );
}
