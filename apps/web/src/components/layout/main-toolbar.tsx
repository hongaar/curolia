import { MapToolbarPicker } from "@/components/map/map-secondary-toolbar";
import { AccountMenu } from "@/components/layout/account-menu";
import { MainToolbarBrandLink } from "@/components/layout/main-toolbar-brand-link";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { MapViewSwitcher } from "@/components/layout/map-view-switcher";
import { Search } from "@/components/layout/search";
import { useMaxSm } from "@/hooks/use-max-sm";
import {
  isMapFullscreenPathname,
  mapViewSegmentFromPathname,
} from "@/lib/app-paths";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@curolia/ui/button";
import { MainToolbar as MainToolbarLayout } from "@curolia/ui/main-toolbar";
import { MapPinPlus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

function WhatsNewToolbarButton() {
  return (
    <Button
      variant="accentSoft"
      rounded
      size="default"
      render={<Link to="/whats-new" />}
    >
      <MapPinPlus />
      What&apos;s new
    </Button>
  );
}

function ToolbarAccountMenu() {
  const { user } = useAuth();

  return user ? (
    <AccountMenu />
  ) : (
    <Button size="sm" render={<Link to="/login" />}>
      Sign in
    </Button>
  );
}

export function MainToolbar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const isMobile = useMaxSm();
  const mobileMapChrome = isMobile && isMapFullscreenPathname(pathname);
  const onMapView =
    mobileMapChrome && mapViewSegmentFromPathname(pathname) === "map";

  return (
    <MainToolbarLayout
      brand={<MainToolbarBrandLink />}
      rightPromo={user ? <WhatsNewToolbarButton /> : null}
      search={user ? <Search /> : null}
      accountMenu={<ToolbarAccountMenu />}
      // Blog/gallery render the picker in their scroll so it scrolls away.
      mapPicker={onMapView ? <MapToolbarPicker density="full" /> : null}
      mobileBottom={
        mobileMapChrome ? (
          <MapViewSwitcher size="default" labelMode="viewport" />
        ) : null
      }
      notifications={user ? <NotificationsMenu /> : null}
    />
  );
}
