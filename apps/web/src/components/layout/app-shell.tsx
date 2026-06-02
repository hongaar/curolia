import { MainToolbar } from "@/components/layout/main-toolbar";
import { NavigationSidebarColumn } from "@/components/layout/navigation-sidebar-column";
import { NotificationsRealtimeSync } from "@/components/layout/notifications-realtime-sync";
import { useNativeBackButton } from "@/hooks/use-native-back-button";
import { useStackTransitions } from "@/hooks/use-stack-transitions";
import { isMapChromeRoute, syncMapRouteDocumentClass } from "@/lib/map-chrome";
import { NAV_SIDEBAR_LAYOUT_FLUSH_EVENT } from "@/lib/navigation-shell-layout";
import { syncStackChromeDocumentClass } from "@/lib/stack-chrome";
import { isStackRoute } from "@/lib/stack-routes";
import { useAuth } from "@/providers/auth-provider";
import {
  NavigationShellProvider,
  useNavigationShell,
} from "@/providers/navigation-shell-provider";
import { TagSidebarProvider } from "@/providers/tag-sidebar-provider";
import { AppShellLayout } from "@curolia/ui/app-shell";
import { useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

function AppShellInner() {
  const { user } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useNavigationShell();
  const { pathname } = useLocation();
  const stackTransitions = useStackTransitions();
  const isMapRoute = isMapChromeRoute(pathname);
  const sidebarOverlaysMain = isMapRoute;
  const showMainToolbar = !stackTransitions || !isStackRoute(pathname);

  useLayoutEffect(() => {
    syncMapRouteDocumentClass(pathname);
    syncStackChromeDocumentClass(pathname);
    if (isMapRoute && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [pathname, isMapRoute, sidebarOpen, setSidebarOpen]);

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
      header={showMainToolbar ? <MainToolbar /> : undefined}
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
