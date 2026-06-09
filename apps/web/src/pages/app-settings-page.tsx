import { PageBackButton } from "@/components/layout/page-back-button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import type { Profile } from "@/types/database";
import { Button } from "@curolia/ui/button";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  FormActions,
  FormSection,
} from "@curolia/ui/form-layout";
import { Label } from "@curolia/ui/label";
import {
  AppPageLayout,
  PageCapitalize,
  PageFormBlockSpaced,
  PageHeader,
  PageHeaderLead,
  PageHeaderTitle,
  PageInlineActions,
  PagePanel,
  PageSwitchRow,
} from "@curolia/ui/page";
import { Switch } from "@curolia/ui/switch";
import type { User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useState } from "react";
import { toast } from "sonner";

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

  async function saveNotificationPrefs() {
    setSavingNotif(true);
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
      toast.error(error.message);
      return;
    }
    toast.success("Notification preferences saved");
    await qc.invalidateQueries({ queryKey: ["profile", user.id] });
  }

  const notifDirty =
    profile != null &&
    (emailNotif !== (profile.notification_email_enabled ?? true) ||
      pushNotif !== (profile.notification_push_enabled ?? false));

  return (
    <FormSection>
      <Field>
        <FieldLabel>Notifications</FieldLabel>
        <FieldDescription>
          In-app notifications are always on. Email and push control how we may
          reach you when delivery is available.
        </FieldDescription>
      </Field>
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
      <FormActions>
        <Button
          type="button"
          size="sm"
          disabled={!notifDirty || savingNotif}
          onClick={() => void saveNotificationPrefs()}
        >
          Save notification preferences
        </Button>
      </FormActions>
    </FormSection>
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
        <PageHeader>
          <PageHeaderTitle>Settings</PageHeaderTitle>
          <PageHeaderLead>Appearance and other preferences.</PageHeaderLead>
        </PageHeader>

        <PageFormBlockSpaced>
          <Field>
            <FieldLabel>Theme</FieldLabel>
            <FieldDescription>
              Choose a color scheme. System follows your device setting.
            </FieldDescription>
            <FieldControl>
              <PageInlineActions spaced="none">
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
            </FieldControl>
            {current === "system" && resolvedTheme ? (
              <FieldDescription>
                Active appearance:{" "}
                <PageCapitalize>{resolvedTheme}</PageCapitalize>
              </FieldDescription>
            ) : null}
          </Field>

          {user ? (
            <NotificationPreferences
              key={profileQuery.data?.updated_at ?? user.id}
              profile={profileQuery.data ?? null}
              user={user}
            />
          ) : null}
        </PageFormBlockSpaced>
      </PagePanel>
    </AppPageLayout>
  );
}
