import type { Meta, StoryObj } from "@storybook/react";
import { MapPlus, User } from "lucide-react";
import { Link } from "react-router-dom";

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
  HomeFeedMapLink,
  HomeFeedMapList,
  HomeFeedMapListEmpty,
  HomeFeedMapListItem,
  HomeFeedNewMapAction,
  HomeFeedShortcutActions,
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
        <HomeFeedMapList title="My maps">
          <HomeFeedMapListItem
            to="/alex/europe"
            title="Europe 2025"
            coverUrl="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80&auto=format&fit=crop"
            iconEmoji="🗺️"
            meta="42 pins · 3d ago"
          />
          <HomeFeedMapListItem
            to="/alex/food"
            title="Food map"
            iconEmoji="🍜"
            meta="26 pins · 1w ago"
          />
          <HomeFeedMapListItem
            to="/alex/weekend-hikes"
            title="Weekend hikes"
            iconEmoji="🥾"
            meta="8 pins · 2d ago"
          />
        </HomeFeedMapList>
        <HomeFeedShortcuts>
          <HomeFeedShortcutActions>
            <HomeFeedNewMapAction>
              <Button>
                <MapPlus aria-hidden />
                New map
              </Button>
            </HomeFeedNewMapAction>
            <HomeFeedNewMapAction>
              <Button variant="outline" render={<Link to="/joram" />}>
                <User aria-hidden />
                View my profile
              </Button>
            </HomeFeedNewMapAction>
          </HomeFeedShortcutActions>
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
    "Sidebar with your-maps list, shortcut actions, compact stream cards, and a denser four-column feed.",
  ),
};

export const MapList: Story = {
  render: () => (
    <div style={{ maxWidth: "14rem" }}>
      <HomeFeedMapList title="My maps">
        <HomeFeedMapListItem
          to="/alex/europe"
          title="Europe 2025"
          coverUrl="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80&auto=format&fit=crop"
          iconEmoji="🗺️"
          meta="42 pins · 3d ago"
        />
        <HomeFeedMapListItem
          to="/alex/food"
          title="Food map"
          iconEmoji="🍜"
          meta="26 pins · 1w ago"
        />
      </HomeFeedMapList>
    </div>
  ),
  ...storyDocs(
    "Sidebar map list rows with cover or emoji thumb, title, and meta.",
  ),
};

export const MapListEmpty: Story = {
  render: () => (
    <div style={{ maxWidth: "14rem" }}>
      <HomeFeedMapList
        title="My maps"
        empty={
          <HomeFeedMapListEmpty>
            Maps you can edit will appear here after changes.
          </HomeFeedMapListEmpty>
        }
      />
    </div>
  ),
  ...storyDocs("Empty sidebar map list placeholder."),
};

export const MapLinkInline: Story = {
  render: () => (
    <div style={{ maxWidth: "24rem" }}>
      <HomeFeedMapLink
        to="/alex/europe"
        title="Wereldreis"
        coverUrl="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80&auto=format&fit=crop"
        iconEmoji="🗺️"
        meta="16 pins · 9h ago"
        inline
      />
    </div>
  ),
  ...storyDocs(
    "Compact inline map link for pin detail headers — fits content width with inset padding.",
  ),
};
