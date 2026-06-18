import { AccountMenu } from "@/components/layout/account-menu";
import { MainToolbarBrandLink } from "@/components/layout/main-toolbar-brand-link";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { PublicMapToolbarSlot } from "@/components/layout/public-map-toolbar-slot";
import { Search } from "@/components/layout/search";
import { MapPicker } from "@/components/map/map-picker";
import { discoverHref, isDiscoverPathname } from "@/lib/discover-routes";
import { useAuth } from "@/providers/auth-provider";
import { useMap } from "@/providers/map-provider";
import { Button } from "@curolia/ui/button";
import {
  MainToolbar as MainToolbarLayout,
  MainToolbarNavCurrent,
} from "@curolia/ui/main-toolbar";
import { Compass } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

function DiscoverToolbarButton() {
  return (
    <Button
      variant="accent"
      rounded
      size="default"
      render={<Link to={discoverHref()} />}
    >
      <Compass />
      Discover
    </Button>
  );
}

function DiscoverAccountMenu() {
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
  const { publicView } = useMap();
  const { pathname } = useLocation();
  const onDiscover = isDiscoverPathname(pathname);

  if (onDiscover) {
    return (
      <MainToolbarLayout
        brand={<MainToolbarBrandLink />}
        navCurrent={
          <MainToolbarNavCurrent icon={<Compass />} label="Discover" />
        }
        accountMenu={<DiscoverAccountMenu />}
      />
    );
  }

  return (
    <MainToolbarLayout
      brand={<MainToolbarBrandLink />}
      leftPromo={!user && !publicView ? <DiscoverToolbarButton /> : null}
      rightPromo={user ? <DiscoverToolbarButton /> : null}
      mapPicker={
        user ? <MapPicker /> : publicView ? <PublicMapToolbarSlot /> : null
      }
      search={user ? <Search /> : null}
      accountMenu={<DiscoverAccountMenu />}
      notifications={user ? <NotificationsMenu /> : null}
    />
  );
}
