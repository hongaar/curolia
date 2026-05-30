import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { journalViewHref } from "@/lib/app-paths";
import { useAuth } from "@/providers/auth-provider";
import { useJournal } from "@/providers/journal-provider";
import { PageBackButton } from "@/components/layout/page-back-button";
import { Button } from "@curolia/ui/button";
import {
  AppPageLayout,
  PageDisplayTitle,
  PageErrorTextSpaced,
  PageInlineActions,
  PageLead,
  PageMuted,
  PagePanel,
} from "@curolia/ui/curolia/page";

export function InvitationsPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const { user } = useAuth();
  const { activeJournal } = useJournal();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!token || !user) return;
    let cancelled = false;
    void (async () => {
      await supabase.rpc("mark_notification_read_by_token", {
        p_invitation_token: token,
      });
      if (!cancelled) {
        void qc.invalidateQueries({ queryKey: ["notifications", user.id] });
        void qc.invalidateQueries({
          queryKey: ["notifications_unread", user.id],
        });
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, user, qc]);

  async function accept() {
    if (!token) return;
    setBusy("accept");
    setError(null);
    const { data: journalId, error: err } = await supabase.rpc(
      "accept_journal_invitation",
      {
        p_token: token,
      },
    );
    setBusy(null);
    if (err) {
      setError(err.message);
      return;
    }
    void qc.invalidateQueries({ queryKey: ["journals", user?.id] });
    void qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
    void qc.invalidateQueries({ queryKey: ["notifications_unread", user?.id] });
    if (journalId && typeof journalId === "string") {
      void qc.invalidateQueries({
        queryKey: ["journal_members_detail", journalId],
      });
      void qc.invalidateQueries({
        queryKey: ["journal_invitations", journalId],
      });
      navigate(`/journals/${journalId}/settings`, { replace: true });
    } else {
      const slug = activeJournal?.slug?.trim();
      navigate(slug ? journalViewHref("map", slug) : "/", { replace: true });
    }
  }

  async function decline() {
    if (!token) return;
    setBusy("decline");
    setError(null);
    const { error: err } = await supabase.rpc("decline_journal_invitation", {
      p_token: token,
    });
    setBusy(null);
    if (err) {
      setError(err.message);
      return;
    }
    void qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
    void qc.invalidateQueries({ queryKey: ["notifications_unread", user?.id] });
    navigate("/notifications", { replace: true });
  }

  if (!token) {
    return (
      <AppPageLayout>
        <PageBackButton />
        <PagePanel>
          <PageMuted>
            Missing invitation link. Open the link from your email or
            notification.
          </PageMuted>
        </PagePanel>
      </AppPageLayout>
    );
  }

  return (
    <AppPageLayout>
      <PageBackButton />
      <PagePanel>
        <PageDisplayTitle>Curolia journal invitation</PageDisplayTitle>
        <PageLead>
          {ready
            ? "You can accept to join this journal or decline."
            : "Loading…"}
        </PageLead>
        {error ? <PageErrorTextSpaced>{error}</PageErrorTextSpaced> : null}
        <PageInlineActions>
          <Button
            disabled={!ready || busy !== null}
            onClick={() => void accept()}
          >
            {busy === "accept" ? "Accepting…" : "Accept"}
          </Button>
          <Button
            variant="outline"
            disabled={!ready || busy !== null}
            onClick={() => void decline()}
          >
            {busy === "decline" ? "Declining…" : "Decline"}
          </Button>
        </PageInlineActions>
      </PagePanel>
    </AppPageLayout>
  );
}
