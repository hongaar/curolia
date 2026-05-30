import { PageBackButton } from "@/components/layout/page-back-button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import type { Profile } from "@/types/database";
import { Button } from "@curolia/ui/button";
import { Label } from "@curolia/ui/label";
import {
  AppPageLayout,
  PageCapitalize,
  PageDisplayTitle,
  PageInlineActions,
  PageLead,
  PageMuted,
  PagePanel,
  PageSectionHeading,
  PageSectionHint,
  PageSectionSpaced,
  PageSwitchRow,
  PageSwitchStack,
} from "@curolia/ui/page";
import { Switch } from "@curolia/ui/switch";
import type { User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useState } from "react";

type ThemeChoice = "light" | "dark" | "system";

function NotificationPreferences({
  profile,
  user,
}: {
  profile: Profile | null;
  user: User;
}) {
  const qc = useQueryClient();
  const [emailNotif, setEmailNotif] = useState(
    () => profile?.notification_email_enabled ?? true,
  );
  const [pushNotif, setPushNotif] = useState(
    () => profile?.notification_push_enabled ?? false,
  );
  const [savingNotif, setSavingNotif] = useState(false);
  const [notifMsg, setNotifMsg] = useState<string | null>(null);

  async function saveNotificationPrefs() {
    setSavingNotif(true);
    setNotifMsg(null);
    const { error } = await supabase
      .from("profiles")
      .update({
        notification_email_enabled: emailNotif,
        notification_push_enabled: pushNotif,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setSavingNotif(false);
    if (error) {
      setNotifMsg(error.message);
      return;
    }
    setNotifMsg("Saved.");
    await qc.invalidateQueries({ queryKey: ["profile", user.id] });
  }

  const notifDirty =
    profile != null &&
    (emailNotif !== (profile.notification_email_enabled ?? true) ||
      pushNotif !== (profile.notification_push_enabled ?? false));

  return (
    <PageSectionSpaced large>
      <PageSectionHeading>Notifications</PageSectionHeading>
      <PageSectionHint>
        In-app notifications are always on. Email and push control how we may
        reach you when delivery is available.
      </PageSectionHint>
      <PageSwitchStack>
        <PageSwitchRow
          label={<Label htmlFor="notif-email">Email</Label>}
          hint="Invitation and activity summaries by email when enabled."
          control={
            <Switch
              id="notif-email"
              checked={emailNotif}
              onCheckedChange={(c) => setEmailNotif(c === true)}
            />
          }
        />
        <PageSwitchRow
          label={<Label htmlFor="notif-push">Push (native app)</Label>}
          hint="When enabled, mobile app installs can receive invitation push notifications."
          control={
            <Switch
              id="notif-push"
              checked={pushNotif}
              onCheckedChange={(c) => setPushNotif(c === true)}
            />
          }
        />
      </PageSwitchStack>
      {notifMsg ? <PageMuted>{notifMsg}</PageMuted> : null}
      <Button
        type="button"
        size="sm"
        disabled={!notifDirty || savingNotif}
        onClick={() => void saveNotificationPrefs()}
      >
        Save notification preferences
      </Button>
    </PageSectionSpaced>
  );
}

export function AppSettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user } = useAuth();

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: Boolean(user),
  });

  const current = (
    theme === "light" || theme === "dark" ? theme : "system"
  ) as ThemeChoice;

  function pick(next: ThemeChoice) {
    setTheme(next);
  }

  return (
    <AppPageLayout>
      <PageBackButton />
      <PagePanel>
        <PageDisplayTitle>Settings</PageDisplayTitle>
        <PageLead>Appearance and other preferences.</PageLead>

        <PageSectionSpaced>
          <PageSectionHeading>Theme</PageSectionHeading>
          <PageSectionHint>
            Choose a color scheme. System follows your device setting.
          </PageSectionHint>
          <PageInlineActions spaced="tight">
            {(
              [
                { id: "light" as const, label: "Light" },
                { id: "dark" as const, label: "Dark" },
                { id: "system" as const, label: "System" },
              ] as const
            ).map(({ id, label }) => (
              <Button
                key={id}
                type="button"
                variant={current === id ? "default" : "outline"}
                size="sm"
                disabled={current === id}
                onClick={() => pick(id)}
              >
                {label}
              </Button>
            ))}
          </PageInlineActions>
          {current === "system" && resolvedTheme ? (
            <PageMuted>
              Active appearance:{" "}
              <PageCapitalize>{resolvedTheme}</PageCapitalize>
            </PageMuted>
          ) : null}
        </PageSectionSpaced>

        {user ? (
          <NotificationPreferences
            key={profileQuery.data?.updated_at ?? user.id}
            profile={profileQuery.data ?? null}
            user={user}
          />
        ) : null}
      </PagePanel>
    </AppPageLayout>
  );
}
