import { NavigationSidebarContent } from "@/components/layout/navigation-sidebar-content";
import { useNavigateToMapSettings } from "@/hooks/use-navigate-to-map-settings";
import { useAuth } from "@/providers/auth-provider";
import { useNavigationShell } from "@/providers/navigation-shell-provider";

/** Scrollable rail body only (aside shell + animation live in AppShell). */
export function NavigationSidebarColumn() {
  const navigateToMapSettings = useNavigateToMapSettings();
  const { user } = useAuth();
  const { openNewMapDialog } = useNavigationShell();

  return (
    <NavigationSidebarContent
      userId={user?.id}
      openNewMapDialog={openNewMapDialog}
      onOpenMapSettings={(mapSlug) => navigateToMapSettings(mapSlug)}
    />
  );
}
