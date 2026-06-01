import { FloatingNav } from "@/components/layout/floating-nav";
import { MobileStackOutlet } from "@/components/layout/mobile-stack-outlet";
import { NavigationSidebarColumn } from "@/components/layout/navigation-sidebar-column";
import { NotificationsRealtimeSync } from "@/components/layout/notifications-realtime-sync";
import { useMobileStackLayout } from "@/hooks/use-mobile-stack-layout";
import { useNativeBackButton } from "@/hooks/use-native-back-button";
import { isMapFullscreenPathname } from "@/lib/app-paths";
import { isMobileStackRoute } from "@/lib/mobile-stack-routes";
import { NAV_SIDEBAR_LAYOUT_FLUSH_EVENT } from "@/lib/navigation-shell-layout";
import { useAuth } from "@/providers/auth-provider";
import {
  NavigationShellProvider,
  useNavigationShell,
} from "@/providers/navigation-shell-provider";
import { TagSidebarProvider } from "@/providers/tag-sidebar-provider";
import { AppShellLayout } from "@curolia/ui/app-shell";
import { useLocation } from "react-router-dom";

function AppShellInner() {
  const { user } = useAuth();
  const { sidebarOpen } = useNavigationShell();
  const { pathname } = useLocation();
  const sidebarOverlaysMain = isMapFullscreenPathname(pathname);
  const useStackLayout = useMobileStackLayout();
  const showFloatingNav = !useStackLayout || !isMobileStackRoute(pathname);

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
      <MobileStackOutlet />
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
