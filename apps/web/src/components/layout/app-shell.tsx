import { FloatingNav } from "@/components/layout/floating-nav";
import { NavigationSidebarColumn } from "@/components/layout/navigation-sidebar-column";
import { NotificationsRealtimeSync } from "@/components/layout/notifications-realtime-sync";
import { useNativeBackButton } from "@/hooks/use-native-back-button";
import { useShellChromePathname } from "@/hooks/use-shell-chrome-pathname";
import { useStackTransitions } from "@/hooks/use-stack-transitions";
import { isMapFullscreenPathname } from "@/lib/app-paths";
import { NAV_SIDEBAR_LAYOUT_FLUSH_EVENT } from "@/lib/navigation-shell-layout";
import { isStackRoute } from "@/lib/stack-routes";
import { useAuth } from "@/providers/auth-provider";
import {
  NavigationShellProvider,
  useNavigationShell,
} from "@/providers/navigation-shell-provider";
import { TagSidebarProvider } from "@/providers/tag-sidebar-provider";
import { AppShellLayout } from "@curolia/ui/app-shell";
import { Outlet, useLocation } from "react-router-dom";

function AppShellInner() {
  const { user } = useAuth();
  const { sidebarOpen } = useNavigationShell();
  const { pathname } = useLocation();
  const chromePathname = useShellChromePathname();
  const stackTransitions = useStackTransitions();
  const sidebarOverlaysMain = isMapFullscreenPathname(chromePathname);
  const showFloatingNav = !stackTransitions || !isStackRoute(pathname);

  useNativeBackButton();

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
      header={showFloatingNav ? <FloatingNav /> : undefined}
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
