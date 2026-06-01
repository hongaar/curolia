import { AccountMenu } from "@/components/layout/account-menu";
import { GlobalSearch } from "@/components/layout/global-search";
import { MapPicker } from "@/components/map/map-picker";
import { MainToolbar as MainToolbarLayout } from "@curolia/ui/main-toolbar";

export function MainToolbar() {
  return (
    <MainToolbarLayout
      mapPicker={<MapPicker />}
      search={<GlobalSearch toolbarEmbed />}
      accountMenu={<AccountMenu />}
    />
  );
}
