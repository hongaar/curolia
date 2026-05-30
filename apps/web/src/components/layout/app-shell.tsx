import { FloatingNav } from "@/components/layout/floating-nav";
import { NavigationSidebarColumn } from "@/components/layout/navigation-sidebar-column";
import { NotificationsRealtimeSync } from "@/components/layout/notifications-realtime-sync";
import { NAV_SIDEBAR_LAYOUT_FLUSH_EVENT } from "@/lib/navigation-shell-layout";
import { useAuth } from "@/providers/auth-provider";
import {
  NavigationShellProvider,
  useNavigationShell,
} from "@/providers/navigation-shell-provider";
import { TagSidebarProvider } from "@/providers/tag-sidebar-provider";
import { isMapFullscreenPathname } from "@/lib/app-paths";
import { AppShellLayout } from "@curolia/ui/curolia/app-shell";
import { Outlet, useLocation } from "react-router-dom";

function AppShellInner() {
  const { user } = useAuth();
  const { sidebarOpen } = useNavigationShell();
  const { pathname } = useLocation();
  const sidebarOverlaysMain = isMapFullscreenPathname(pathname);

  return (
    <AppShellLayout
      sidebarOpen={sidebarOpen}
      overlayMain={sidebarOverlaysMain}
      onSidebarTransitionEnd={(event) => {
        if (
          event.propertyName === "width" &&
          event.target === event.currentTarget
        ) {
          window.dispatchEvent(new CustomEvent(NAV_SIDEBAR_LAYOUT_FLUSH_EVENT));
          window.dispatchEvent(new Event("resize"));
        }
      }}
      sidebar={<NavigationSidebarColumn />}
      notifications={
        user ? <NotificationsRealtimeSync userId={user.id} /> : null
      }
      header={<FloatingNav />}
    >
      <Outlet />
    </AppShellLayout>
  );
}

export function AppShell() {
  return (
    <TagSidebarProvider>
      <NavigationShellProvider>
        <AppShellInner />
      </NavigationShellProvider>
    </TagSidebarProvider>
  );
}
