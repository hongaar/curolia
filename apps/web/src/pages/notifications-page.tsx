import { PageBackButton } from "@/components/layout/page-back-button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import type { AppNotification } from "@/types/database";
import {
  BorderedList,
  ListEmptyItem,
  NotificationListButton,
} from "@curolia/ui/list";
import {
  AppPageLayout,
  PageDisplayTitle,
  PageLead,
  PagePanel,
} from "@curolia/ui/page";
import { Stack } from "@curolia/ui/stack";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["notifications", user?.id, "all"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as AppNotification[];
    },
    enabled: Boolean(user),
  });

  async function openOne(n: AppNotification) {
    if (!user) return;
    if (!n.read_at) {
      await supabase.rpc("mark_notification_read", { p_notification_id: n.id });
      void qc.invalidateQueries({ queryKey: ["notifications", user.id] });
      void qc.invalidateQueries({
        queryKey: ["notifications", user.id, "all"],
      });
      void qc.invalidateQueries({
        queryKey: ["notifications_unread", user.id],
      });
    }
    if (n.action_path) {
      navigate(n.action_path);
    }
  }

  const items = listQuery.data ?? [];

  return (
    <AppPageLayout>
      <PageBackButton />
      <PagePanel>
        <Stack gap="xl">
          <Stack gap="xs">
            <PageDisplayTitle>Notifications</PageDisplayTitle>
            <PageLead>
              Opens are marked as read. Email and push use your settings.
            </PageLead>
          </Stack>
          <BorderedList>
            {listQuery.isLoading ? (
              <ListEmptyItem>Loading…</ListEmptyItem>
            ) : items.length === 0 ? (
              <ListEmptyItem>Nothing here yet.</ListEmptyItem>
            ) : (
              items.map((n) => (
                <NotificationListButton
                  key={n.id}
                  unread={!n.read_at}
                  onClick={() => void openOne(n)}
                  title={n.title}
                  body={n.body ?? undefined}
                  meta={new Date(n.created_at).toLocaleString()}
                />
              ))
            )}
          </BorderedList>
        </Stack>
      </PagePanel>
    </AppPageLayout>
  );
}
