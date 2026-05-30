import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageBackButton } from "@/components/layout/page-back-button";
import { Button } from "@curolia/ui/button";
import { Label } from "@curolia/ui/label";
import { Switch } from "@curolia/ui/switch";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import type { Profile } from "@/types/database";
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
} from "@curolia/ui/curolia/page";

type ThemeChoice = "light" | "dark" | "system";

export function AppSettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);
  const [notifMsg, setNotifMsg] = useState<string | null>(null);

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

  useEffect(() => {
    const p = profileQuery.data;
    if (!p) return;
    setEmailNotif(p.notification_email_enabled ?? true);
    setPushNotif(p.notification_push_enabled ?? false);
  }, [profileQuery.data]);

  const current = (
    theme === "light" || theme === "dark" ? theme : "system"
  ) as ThemeChoice;

  function pick(next: ThemeChoice) {
    setTheme(next);
  }

  async function saveNotificationPrefs() {
    if (!user) return;
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
    profileQuery.data != null &&
    (emailNotif !== (profileQuery.data.notification_email_enabled ?? true) ||
      pushNotif !== (profileQuery.data.notification_push_enabled ?? false));

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

        <PageSectionSpaced large>
          <PageSectionHeading>Notifications</PageSectionHeading>
          <PageSectionHint>
            In-app notifications are always on. Email and push control how we
            may reach you when delivery is available.
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
            disabled={!notifDirty || savingNotif || !user}
            onClick={() => void saveNotificationPrefs()}
          >
            Save notification preferences
          </Button>
        </PageSectionSpaced>
      </PagePanel>
    </AppPageLayout>
  );
}
