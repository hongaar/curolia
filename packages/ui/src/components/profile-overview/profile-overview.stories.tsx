import type { Meta, StoryObj } from "@storybook/react";
import { ChevronDown, Globe } from "lucide-react";

import { withMemoryRouter } from "../../storybook/decorators";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Button } from "../button";
import { MapCard, MapCardMasonryGrid } from "../map-card";
import { PageFitButton, PageInlineActions, PagePanel } from "../page";
import {
  ProfileOverviewAside,
  ProfileOverviewIdentity,
  ProfileOverviewLayout,
  ProfileOverviewMain,
  ProfileOverviewStatButton,
  ProfileOverviewStats,
} from "./profile-overview";

const meta = {
  title: "Profile overview",
  component: ProfileOverviewLayout,
  ...componentStoryMeta(
    "Two-column public profile layout with sidebar cards and an open map grid.",
    "Use `ProfileOverviewAside` for stacked `PagePanel` cards and `ProfileOverviewMain` for uncarded map content.",
  ),
  decorators: [withMemoryRouter],
} satisfies Meta<typeof ProfileOverviewLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OwnerView: Story = {
  render: () => (
    <ProfileOverviewLayout>
      <ProfileOverviewAside>
        <PagePanel mobileCard>
          <ProfileOverviewIdentity
            avatar={
              <div
                style={{
                  width: "6rem",
                  height: "6rem",
                  borderRadius: "9999px",
                  background: "var(--muted)",
                }}
              />
            }
            name="Alex Example"
            bio="Mapping cities, coffee stops, and long walks."
          />
          <ProfileOverviewStats>
            <ProfileOverviewStatButton
              label="Followers"
              value="128"
              aria-label="Followers: 128"
            />
            <ProfileOverviewStatButton
              label="Following"
              value="24"
              aria-label="Following: 24"
            />
          </ProfileOverviewStats>
          <PageFitButton>
            <PageInlineActions spaced="none">
              <Button variant="outline">Edit profile</Button>
              <Button variant="outline" aria-label="Profile visibility">
                <Globe aria-hidden size={16} />
                Public
                <ChevronDown aria-hidden size={16} />
              </Button>
            </PageInlineActions>
          </PageFitButton>
        </PagePanel>
      </ProfileOverviewAside>
      <ProfileOverviewMain>
        <MapCardMasonryGrid>
          <MapCard
            to="/alex/europe"
            title="Europe 2025"
            description="Summer road trip."
            coverUrl="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80&auto=format&fit=crop"
            iconEmoji="🗺️"
            layoutSeed="story-europe"
            pinCountLabel="42 pins"
            updatedLabel="Updated 3d ago"
          />
          <MapCard
            to="/alex/food"
            title="Food map"
            iconEmoji="🍜"
            layoutSeed="story-food"
            pinCountLabel="26 pins"
            updatedLabel="Updated 2h ago"
          />
        </MapCardMasonryGrid>
      </ProfileOverviewMain>
    </ProfileOverviewLayout>
  ),
  ...storyDocs("Owner view with edit actions and an open map grid."),
};

export const VisitorView: Story = {
  render: () => (
    <ProfileOverviewLayout>
      <ProfileOverviewAside>
        <PagePanel mobileCard>
          <ProfileOverviewIdentity
            avatar={
              <div
                style={{
                  width: "6rem",
                  height: "6rem",
                  borderRadius: "9999px",
                  background: "var(--muted)",
                }}
              />
            }
            name="Alex Example"
            bio="Mapping cities, coffee stops, and long walks."
          />
        </PagePanel>
      </ProfileOverviewAside>
      <ProfileOverviewMain>
        <MapCardMasonryGrid>
          <MapCard
            to="/alex/europe"
            title="Europe 2025"
            coverUrl="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80&auto=format&fit=crop"
            iconEmoji="🗺️"
            layoutSeed="story-europe"
          />
        </MapCardMasonryGrid>
      </ProfileOverviewMain>
    </ProfileOverviewLayout>
  ),
  ...storyDocs("Visitor view with only the profile info card in the sidebar."),
};
