import type { Meta, StoryObj } from "@storybook/react";
import { Plug, User } from "lucide-react";

import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Button } from "../button";
import {
  MapCard,
  MapCardCompact,
  MapCardMasonryGrid,
  MapCardStreamItem,
  MapCardStreamPanel,
} from "../map-card";
import {
  HomeFeedAside,
  HomeFeedLayout,
  HomeFeedMain,
  HomeFeedNewMapAction,
  HomeFeedShortcutLink,
  HomeFeedShortcuts,
} from "./home-feed";

const meta = {
  title: "Home feed",
  ...componentStoryMeta(
    "Signed-in home feed layout with shortcut sidebar and map streams.",
    "Compose `HomeFeedLayout` with `HomeFeedAside` shortcuts and open main content for stream panels plus masonry updates.",
  ),
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Layout: Story = {
  render: () => (
    <HomeFeedLayout>
      <HomeFeedAside>
        <HomeFeedShortcuts>
          <HomeFeedNewMapAction>
            <Button>New map</Button>
          </HomeFeedNewMapAction>
          <HomeFeedShortcutLink to="/joram" icon={<User />}>
            Profile
          </HomeFeedShortcutLink>
          <HomeFeedShortcutLink to="/plugins" icon={<Plug />}>
            Plugins
          </HomeFeedShortcutLink>
        </HomeFeedShortcuts>
      </HomeFeedAside>
      <HomeFeedMain>
        <MapCardStreamPanel title="Recently visited">
          <MapCardStreamItem>
            <MapCardCompact
              to="/alex/europe"
              title="Europe 2025"
              coverUrl="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80&auto=format&fit=crop"
              iconEmoji="🗺️"
              subtitle="42 pins"
            />
          </MapCardStreamItem>
          <MapCardStreamItem>
            <MapCardCompact
              to="/alex/food"
              title="Food map"
              iconEmoji="🍜"
              subtitle="26 pins"
            />
          </MapCardStreamItem>
        </MapCardStreamPanel>
        <MapCardMasonryGrid columns={4}>
          <MapCard
            to="/alex/europe"
            title="Europe 2025"
            description="by Alex"
            coverUrl="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80&auto=format&fit=crop"
            iconEmoji="🗺️"
            layoutSeed="map-europe"
            pinCountLabel="42 pins"
            updatedLabel="Updated 3d ago"
          />
          <MapCard
            to="/alex/weekend-hikes"
            title="Weekend hikes"
            description="by Alex"
            iconEmoji="🥾"
            layoutSeed="map-hikes"
            pinCountLabel="8 pins"
            updatedLabel="Updated 1w ago"
          />
        </MapCardMasonryGrid>
      </HomeFeedMain>
    </HomeFeedLayout>
  ),
  ...storyDocs(
    "Desktop sidebar with compact stream cards and a denser four-column feed.",
  ),
};
