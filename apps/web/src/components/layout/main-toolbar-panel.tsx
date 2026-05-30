import { useQuery } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import {
  MainToolbarBrand,
  MainToolbarMenuButton,
  MainToolbarMenuIcon,
  MainToolbarSearchSlot,
  MainToolbarShell,
  MainToolbarUnreadDot,
} from "@curolia/ui/curolia/main-toolbar";
import { GlobalSearch } from "@/components/layout/global-search";
import { useAuth } from "@/providers/auth-provider";
import { useNavigationShell } from "@/providers/navigation-shell-provider";
import { supabase } from "@/lib/supabase";

export function MainToolbarPanel() {
  const { sidebarOpen, setSidebarOpen } = useNavigationShell();
  const { user } = useAuth();

  const unreadNotificationsQuery = useQuery({
    queryKey: ["notifications_unread", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", user.id)
        .is("read_at", null)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data != null;
    },
    enabled: Boolean(user),
  });

  return (
    <MainToolbarShell>
      <MainToolbarMenuButton
        aria-label={
          unreadNotificationsQuery.data
            ? "Toggle menu — unread notifications"
            : "Toggle menu"
        }
        aria-expanded={sidebarOpen}
        aria-controls="curolia-navigation-sidebar"
        id="curolia-navigation-menu-trigger"
        onClick={() => setSidebarOpen((o) => !o)}
      >
        <MainToolbarMenuIcon>
          <Menu />
        </MainToolbarMenuIcon>
        {unreadNotificationsQuery.data === true ? (
          <MainToolbarUnreadDot />
        ) : null}
      </MainToolbarMenuButton>

      <MainToolbarBrand>Curolia</MainToolbarBrand>

      <MainToolbarSearchSlot>
        <GlobalSearch toolbarEmbed />
      </MainToolbarSearchSlot>
    </MainToolbarShell>
  );
}
