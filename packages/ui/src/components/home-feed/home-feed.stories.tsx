import type { Meta, StoryObj } from "@storybook/react";
import { Pencil, Plus } from "lucide-react";

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
  HomeFeedChangelog,
  HomeFeedChangelogItem,
  HomeFeedLayout,
  HomeFeedMain,
  HomeFeedMapLink,
  HomeFeedMapList,
  HomeFeedMapListEmpty,
  HomeFeedMapListItem,
  HomeFeedProfileLink,
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

const avatar = (
  <img
    src="https://i.pravatar.cc/80?img=12"
    alt=""
    width={36}
    height={36}
    style={{ borderRadius: "999px" }}
  />
);

function DemoProfileLink() {
  return (
    <HomeFeedProfileLink
      to="/alex"
      avatar={avatar}
      title="Signed in as Alex"
      subtitle="View my profile"
    />
  );
}

function DemoChangelog({ admin = false }: { admin?: boolean }) {
  const actions = admin ? (
    <Button size="icon-xs" variant="ghost" aria-label="Edit">
      <Pencil aria-hidden />
    </Button>
  ) : undefined;
  return (
    <HomeFeedChangelog
      title="What's new"
      action={
        admin ? (
          <Button size="icon-xs" variant="ghost" aria-label="Add entry">
            <Plus aria-hidden />
          </Button>
        ) : undefined
      }
    >
      <HomeFeedChangelogItem
        date="Nov 23, 2026"
        imageUrl="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80&auto=format&fit=crop"
        actions={actions}
      >
        Country flags now show in the emoji picker on every platform.
      </HomeFeedChangelogItem>
      <HomeFeedChangelogItem date="Nov 12, 2026" actions={actions}>
        Pins in blog and gallery panels pick up their tag color on focus.
      </HomeFeedChangelogItem>
    </HomeFeedChangelog>
  );
}

export const Layout: Story = {
  render: () => (
    <HomeFeedLayout>
      <HomeFeedAside>
        <DemoProfileLink />
        <DemoChangelog />
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
    "Sidebar with profile link and changelog, compact stream cards, and a denser four-column feed.",
  ),
};

export const ProfileLink: Story = {
  render: () => (
    <div style={{ maxWidth: "14rem" }}>
      <DemoProfileLink />
    </div>
  ),
  ...storyDocs("Avatar button with signed-in name and a profile link row."),
};

export const Changelog: Story = {
  render: () => (
    <div style={{ maxWidth: "14rem" }}>
      <DemoChangelog />
    </div>
  ),
  ...storyDocs("Changelog entries with date, optional image, and text."),
};

export const ChangelogAdmin: Story = {
  render: () => (
    <div style={{ maxWidth: "14rem" }}>
      <DemoChangelog admin />
    </div>
  ),
  ...storyDocs(
    "Admin view: add action in the header, edit controls per entry.",
  ),
};

export const ChangelogEmpty: Story = {
  render: () => (
    <div style={{ maxWidth: "14rem" }}>
      <HomeFeedChangelog
        title="What's new"
        empty={<HomeFeedMapListEmpty>No updates yet.</HomeFeedMapListEmpty>}
      />
    </div>
  ),
  ...storyDocs("Empty changelog placeholder."),
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
