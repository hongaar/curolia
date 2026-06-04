import { AccountMenu } from "@/components/layout/account-menu";
import { GlobalSearch } from "@/components/layout/global-search";
import { MainToolbarBrandLink } from "@/components/layout/main-toolbar-brand-link";
import { MapViewSwitcher } from "@/components/layout/map-view-switcher";
import { MapPicker } from "@/components/map/map-picker";
import { MainToolbar as MainToolbarLayout } from "@curolia/ui/main-toolbar";

export function MainToolbar() {
  return (
    <MainToolbarLayout
      brand={<MainToolbarBrandLink />}
      mapPicker={
        <>
          <MapPicker />
          <MapViewSwitcher />
        </>
      }
      search={<GlobalSearch toolbarEmbed />}
      accountMenu={<AccountMenu />}
    />
  );
}
