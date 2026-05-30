import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Popover } from "@curolia/ui/popover";
import type { AppNotification } from "@/types/database";
import {
  NotificationsIconPopoverTrigger,
  NotificationsPopoverContent,
  NotificationsPopoverHeader,
  NotificationsPopoverItem,
  NotificationsPopoverScroll,
  NotificationsSeeAllButton,
  NotificationsSidebarPopoverTrigger,
  NotificationsSidebarTriggerInner,
} from "@curolia/ui/notifications-popover";
import { FormMutedText } from "@curolia/ui/form-layout";

type NotificationsPopoverProps = {
  userId: string;
  variant?: "icon" | "sidebar-row";
};

export function NotificationsPopover({
  userId,
  variant = "icon",
}: NotificationsPopoverProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const {
    data: items = [],
    refetch,
    isPending,
    isFetching,
  } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(15);
      if (error) throw error;
      return (data ?? []) as AppNotification[];
    },
    enabled: Boolean(userId),
  });

  React.useEffect(() => {
    if (open && userId) void refetch();
  }, [open, userId, refetch]);

  async function openNotification(n: AppNotification) {
    if (!n.read_at) {
      await supabase.rpc("mark_notification_read", { p_notification_id: n.id });
      void qc.invalidateQueries({ queryKey: ["notifications", userId] });
      void qc.invalidateQueries({ queryKey: ["notifications_unread", userId] });
    }
    if (n.action_path) {
      navigate(n.action_path);
    } else {
      navigate("/notifications");
    }
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {variant === "sidebar-row" ? (
        <NotificationsSidebarPopoverTrigger
          title="Notifications"
          aria-label="Notifications"
        >
          <NotificationsSidebarTriggerInner
            icon={<Bell aria-hidden />}
            label="Notifications"
          />
        </NotificationsSidebarPopoverTrigger>
      ) : (
        <NotificationsIconPopoverTrigger
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell aria-hidden />
        </NotificationsIconPopoverTrigger>
      )}
      <NotificationsPopoverContent
        align={variant === "sidebar-row" ? "start" : "end"}
        sideOffset={variant === "sidebar-row" ? 6 : 8}
      >
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
          {open ? (
            isPending || isFetching ? (
              <FormMutedText>Loading…</FormMutedText>
            ) : items.length === 0 ? (
              <FormMutedText>No notifications yet.</FormMutedText>
            ) : (
              <ul>
                {items.map((n) => (
                  <NotificationsPopoverItem
                    key={n.id}
                    unread={!n.read_at}
                    onClick={() => void openNotification(n)}
                    title={n.title}
                    body={n.body ?? undefined}
                  />
                ))}
              </ul>
            )
          ) : null}
        </NotificationsPopoverScroll>
      </NotificationsPopoverContent>
    </Popover>
  );
}
