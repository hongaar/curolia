import { AccountMenu } from "@/components/layout/account-menu";
import { MainToolbarBrandLink } from "@/components/layout/main-toolbar-brand-link";
import { PublicMapToolbarSlot } from "@/components/layout/public-map-toolbar-slot";
import { Search } from "@/components/layout/search";
import { MapPicker } from "@/components/map/map-picker";
import { useAuth } from "@/providers/auth-provider";
import { useMap } from "@/providers/map-provider";
import { Button } from "@curolia/ui/button";
import { MainToolbar as MainToolbarLayout } from "@curolia/ui/main-toolbar";
import { Link } from "react-router-dom";

export function MainToolbar() {
  const { user } = useAuth();
  const { publicView } = useMap();

  return (
    <MainToolbarLayout
      brand={<MainToolbarBrandLink />}
      mapPicker={publicView ? <PublicMapToolbarSlot /> : <MapPicker />}
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
    />
  );
}
