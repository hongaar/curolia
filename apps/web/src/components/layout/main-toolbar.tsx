import { AccountMenu } from "@/components/layout/account-menu";
import { MainToolbarBrandLink } from "@/components/layout/main-toolbar-brand-link";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { PublicMapToolbarSlot } from "@/components/layout/public-map-toolbar-slot";
import { Search } from "@/components/layout/search";
import { MapPicker } from "@/components/map/map-picker";
import { discoverHref } from "@/lib/discover-routes";
import { useAuth } from "@/providers/auth-provider";
import { useMap } from "@/providers/map-provider";
import { Button } from "@curolia/ui/button";
import { MainToolbar as MainToolbarLayout } from "@curolia/ui/main-toolbar";
import { Compass } from "lucide-react";
import { Link } from "react-router-dom";

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

export function MainToolbar() {
  const { user } = useAuth();
  const { publicView } = useMap();

  return (
    <MainToolbarLayout
      brand={<MainToolbarBrandLink />}
      leftPromo={!user && !publicView ? <DiscoverToolbarButton /> : null}
      rightPromo={user ? <DiscoverToolbarButton /> : null}
      mapPicker={
        user ? <MapPicker /> : publicView ? <PublicMapToolbarSlot /> : null
      }
      search={user ? <Search /> : null}
      accountMenu={
        user ? (
          <AccountMenu />
        ) : (
          <Button size="sm" render={<Link to="/login" />}>
            Sign in
          </Button>
        )
      }
      notifications={user ? <NotificationsMenu /> : null}
    />
  );
}
