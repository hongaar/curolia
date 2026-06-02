import type { Meta, StoryObj } from "@storybook/react";
import { Search } from "lucide-react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Button } from "../button";
import { DropdownMenu } from "../dropdown-menu";
import { AccountMenuContent, AccountMenuTrigger } from "../floating-nav-bar";
import {
  GlobalSearchIcon,
  GlobalSearchInput,
  GlobalSearchToolbarAnchor,
  GlobalSearchToolbarField,
} from "../global-search";
import { Input } from "../input";
import { MapPickerContent, MapPickerTrigger } from "../map-picker";
import { Popover } from "../popover";
import { UserAvatar } from "../user-avatar";
import { MainToolbar } from "./main-toolbar";

const meta = {
  title: "Main Toolbar",
  ...componentStoryMeta(
    "App-wide top bar: Curolia brand, map picker, search, and account menu.",
    "Use `MainToolbar` on every signed-in page. Pass `mapPicker`, `search`, and `accountMenu` slots.",
  ),
  component: MainToolbar,
  args: {
    logoSrc: "/favicon.png",
    brandLabel: "Curolia",
  },
} satisfies Meta<typeof MainToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

function DemoMapPicker() {
  return (
    <DropdownMenu>
      <MapPickerTrigger
        mapEmoji="🗺️"
        mapName="My map"
        aria-label="Select map"
      />
      <MapPickerContent>
        <Button variant="ghost" size="sm">
          Map list…
        </Button>
      </MapPickerContent>
    </DropdownMenu>
  );
}

function DemoSearch() {
  return (
    <Popover modal={false}>
      <GlobalSearchToolbarAnchor>
        <GlobalSearchToolbarField>
          <GlobalSearchIcon>
            <Search aria-hidden />
          </GlobalSearchIcon>
          <GlobalSearchInput
            variant="toolbar"
            placeholder="Search…"
            aria-label="Search"
          />
        </GlobalSearchToolbarField>
      </GlobalSearchToolbarAnchor>
    </Popover>
  );
}

function DemoAccountMenu() {
  return (
    <DropdownMenu>
      <AccountMenuTrigger title="Account" aria-label="Account menu">
        <UserAvatar
          email="demo@curolia.app"
          storedAvatarUrl={null}
          label="Demo"
          size="full"
        />
      </AccountMenuTrigger>
      <AccountMenuContent>
        <Button variant="ghost" size="sm">
          Profile
        </Button>
      </AccountMenuContent>
    </DropdownMenu>
  );
}

export const Default: Story = {
  parameters: storyDocs(
    "Desktop-style bar with brand, map picker, search, and account.",
  ),
  render: (args) => (
    <div style={{ minHeight: "6rem" }}>
      <MainToolbar
        {...args}
        mapPicker={<DemoMapPicker />}
        search={<DemoSearch />}
        accountMenu={<DemoAccountMenu />}
      />
    </div>
  ),
};

export const MapPickerOnly: Story = {
  parameters: storyDocs("Brand + map picker without center search."),
  render: (args) => (
    <MainToolbar
      {...args}
      mapPicker={<DemoMapPicker />}
      accountMenu={<DemoAccountMenu />}
    />
  ),
};

export const WithInputSearch: Story = {
  parameters: storyDocs("Plain input in the search slot for layout checks."),
  render: (args) => (
    <MainToolbar
      {...args}
      mapPicker={<DemoMapPicker />}
      search={<Input placeholder="Search pins…" aria-label="Search" />}
      accountMenu={<DemoAccountMenu />}
    />
  ),
};
