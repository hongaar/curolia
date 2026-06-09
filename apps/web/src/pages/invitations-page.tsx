import { PageBackButton } from "@/components/layout/page-back-button";
import { mapSettingsHref, mapViewHref } from "@/lib/app-paths";
import { mapRouteForMap } from "@/lib/map-route";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import { useMap } from "@/providers/map-provider";
import { Button } from "@curolia/ui/button";
import {
  AppPageLayout,
  PageErrorTextSpaced,
  PageHeader,
  PageHeaderLead,
  PageHeaderTitle,
  PageInlineActions,
  PageMuted,
  PagePanel,
} from "@curolia/ui/page";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function InvitationsPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const { user } = useAuth();
  const { activeMap } = useMap();
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
    const { data: mapId, error: err } = await supabase.rpc(
      "accept_map_invitation",
      {
        p_token: token,
      },
    );
    setBusy(null);
    if (err) {
      setError(err.message);
      return;
    }
    void qc.invalidateQueries({ queryKey: ["maps", user?.id] });
    void qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
    void qc.invalidateQueries({ queryKey: ["notifications_unread", user?.id] });
    if (mapId && typeof mapId === "string") {
      void qc.invalidateQueries({
        queryKey: ["map_members_detail", mapId],
      });
      void qc.invalidateQueries({
        queryKey: ["map_invitations", mapId],
      });
      const { data: mapRow, error: mapError } = await supabase
        .from("maps")
        .select("slug, created_by_user_id")
        .eq("id", mapId)
        .maybeSingle();
      if (mapError) {
        setError(mapError.message);
        return;
      }
      if (!mapRow) {
        navigate("/", { replace: true });
        return;
      }
      const mapSlug = mapRow.slug?.trim();
      if (!mapSlug) {
        navigate("/", { replace: true });
        return;
      }
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("slug")
        .eq("id", mapRow.created_by_user_id)
        .maybeSingle();
      if (profileError) {
        setError(profileError.message);
        return;
      }
      const profileSlug = profile?.slug?.trim();
      navigate(profileSlug ? mapSettingsHref({ profileSlug, mapSlug }) : "/", {
        replace: true,
      });
    } else {
      navigate(
        activeMap?.owner_profile_slug
          ? mapViewHref("map", mapRouteForMap(activeMap))
          : "/",
        { replace: true },
      );
    }
  }

  async function decline() {
    if (!token) return;
    setBusy("decline");
    setError(null);
    const { error: err } = await supabase.rpc("decline_map_invitation", {
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
        <PageHeader>
          <PageHeaderTitle>Curolia map invitation</PageHeaderTitle>
          <PageHeaderLead>
            {ready ? "You can accept to join this map or decline." : "Loading…"}
          </PageHeaderLead>
        </PageHeader>
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
