import { useUnreadNotificationsCount } from "@/hooks/use-map-access";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import type { AppNotification } from "@/types/database";
import {
  NotificationsIconPopoverTrigger,
  NotificationsPopoverContent,
  NotificationsPopoverEmpty,
  NotificationsPopoverHeader,
  NotificationsPopoverItem,
  NotificationsPopoverList,
  NotificationsPopoverScroll,
  NotificationsSeeAllButton,
} from "@curolia/ui/notifications-popover";
import { Popover } from "@curolia/ui/popover";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const POPOVER_LIMIT = 12;

function invalidateNotificationQueries(
  qc: ReturnType<typeof useQueryClient>,
  userId: string,
) {
  void qc.invalidateQueries({ queryKey: ["notifications", userId] });
  void qc.invalidateQueries({ queryKey: ["notifications", userId, "all"] });
  void qc.invalidateQueries({ queryKey: ["notifications_unread", userId] });
}

export function NotificationsMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const unreadQuery = useUnreadNotificationsCount(user?.id);
  const hasUnread = (unreadQuery.data ?? 0) > 0;

  const listQuery = useQuery({
    queryKey: ["notifications", user?.id, "popover"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(POPOVER_LIMIT);
      if (error) throw error;
      return (data ?? []) as AppNotification[];
    },
    enabled: Boolean(user) && open,
  });

  async function openOne(notification: AppNotification) {
    if (!user) return;
    if (!notification.read_at) {
      await supabase.rpc("mark_notification_read", {
        p_notification_id: notification.id,
      });
      invalidateNotificationQueries(qc, user.id);
    }
    setOpen(false);
    if (notification.action_path) {
      navigate(notification.action_path);
    }
  }

  const items = listQuery.data ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <NotificationsIconPopoverTrigger
        hasUnread={hasUnread}
        aria-label="Notifications"
        title="Notifications"
      />
      <NotificationsPopoverContent align="end" sideOffset={8}>
        <NotificationsPopoverHeader
          title="Notifications"
          action={
            <NotificationsSeeAllButton
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
            >
              See all
            </NotificationsSeeAllButton>
          }
        />
        <NotificationsPopoverScroll>
          {listQuery.isLoading ? (
            <NotificationsPopoverEmpty>Loading…</NotificationsPopoverEmpty>
          ) : items.length === 0 ? (
            <NotificationsPopoverEmpty>
              Nothing here yet.
            </NotificationsPopoverEmpty>
          ) : (
            <NotificationsPopoverList>
              {items.map((notification) => (
                <NotificationsPopoverItem
                  key={notification.id}
                  unread={!notification.read_at}
                  title={notification.title}
                  body={notification.body ?? undefined}
                  onClick={() => void openOne(notification)}
                />
              ))}
            </NotificationsPopoverList>
          )}
        </NotificationsPopoverScroll>
      </NotificationsPopoverContent>
    </Popover>
  );
}
