import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Button } from "../button";
import { PageHeader, PageHeaderLead, PageHeaderTitle } from "../page";
import { PluginIconFrame } from "../plugin-icon-frame";
import { Switch } from "../switch";
import {
  PluginGrid,
  PluginGridCard,
  PluginGridCardActions,
  PluginGridCardConfigureButton,
  PluginGridCardDescription,
  PluginGridCardFooter,
  PluginGridCardFooterRow,
  PluginGridCardHeading,
  PluginGridCardIcon,
  PluginGridCardTitle,
  PluginGridCardToggle,
  PluginGridCardTop,
  PluginListIcon,
  PluginListRow,
  PluginListRowDescription,
  PluginListRowInfo,
  PluginListRowMain,
  PluginListRowTitle,
  PluginListRowToggle,
} from "./plugins";

const meta = {
  title: "Plugins",
  ...componentStoryMeta(
    `Plugin grid cards for the global plugins settings page.`,
    `Each plugin is a compact \`PluginGridCard\` with icon, title, description, and actions.`,
  ),
  component: PluginGridCard,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Grid: Story = {
  parameters: storyDocs("Responsive plugin grid with setup actions."),
  render: () => (
    <StoryFrame width="2xl">
      <PageHeader>
        <PageHeaderTitle>Plugins</PageHeaderTitle>
        <PageHeaderLead>
          Enable integrations from the grid and link accounts when needed.
        </PageHeaderLead>
      </PageHeader>
      <PluginGrid>
        <PluginGridCard>
          <PluginGridCardTop>
            <PluginGridCardIcon>
              <PluginIconFrame size={4}>
                <span aria-hidden>🎵</span>
              </PluginIconFrame>
            </PluginGridCardIcon>
            <PluginGridCardHeading>
              <PluginGridCardTitle>Spotify</PluginGridCardTitle>
              <PluginGridCardDescription>
                Add top tracks for each pin&apos;s dates.
              </PluginGridCardDescription>
            </PluginGridCardHeading>
            <PluginGridCardToggle>
              <Switch defaultChecked aria-label="Enable Spotify" />
            </PluginGridCardToggle>
          </PluginGridCardTop>
          <PluginGridCardFooter>
            <PluginGridCardFooterRow>
              <PluginGridCardActions>
                <Button type="button" size="sm">
                  Link account
                </Button>
              </PluginGridCardActions>
            </PluginGridCardFooterRow>
          </PluginGridCardFooter>
        </PluginGridCard>
        <PluginGridCard>
          <PluginGridCardTop>
            <PluginGridCardIcon>
              <PluginIconFrame size={4}>
                <span aria-hidden>📖</span>
              </PluginIconFrame>
            </PluginGridCardIcon>
            <PluginGridCardHeading>
              <PluginGridCardTitle>Wikidata</PluginGridCardTitle>
              <PluginGridCardDescription>
                Nearby landmarks and Wikipedia articles on pins.
              </PluginGridCardDescription>
            </PluginGridCardHeading>
            <PluginGridCardToggle>
              <Switch defaultChecked aria-label="Enable Wikidata" />
            </PluginGridCardToggle>
          </PluginGridCardTop>
          <PluginGridCardFooter>
            <PluginGridCardFooterRow>
              <PluginGridCardActions>
                <PluginGridCardConfigureButton onClick={() => undefined} />
              </PluginGridCardActions>
            </PluginGridCardFooterRow>
          </PluginGridCardFooter>
        </PluginGridCard>
        <PluginGridCard>
          <PluginGridCardTop>
            <PluginGridCardIcon>
              <PluginIconFrame size={4}>
                <span aria-hidden>☀️</span>
              </PluginIconFrame>
            </PluginGridCardIcon>
            <PluginGridCardHeading>
              <PluginGridCardTitle>Open-Meteo</PluginGridCardTitle>
              <PluginGridCardDescription>
                Weather summaries on pins and the map.
              </PluginGridCardDescription>
            </PluginGridCardHeading>
            <PluginGridCardToggle>
              <Switch defaultChecked aria-label="Enable Open-Meteo" />
            </PluginGridCardToggle>
          </PluginGridCardTop>
          <PluginGridCardFooter>
            <PluginGridCardFooterRow>
              <PluginGridCardActions />
            </PluginGridCardFooterRow>
          </PluginGridCardFooter>
        </PluginGridCard>
        <PluginGridCard unavailable>
          <PluginGridCardTop>
            <PluginGridCardIcon>
              <PluginIconFrame size={4}>
                <span aria-hidden>📍</span>
              </PluginIconFrame>
            </PluginGridCardIcon>
            <PluginGridCardHeading>
              <PluginGridCardTitle>Polarsteps</PluginGridCardTitle>
              <PluginGridCardDescription>
                Import trips from Polarsteps.
              </PluginGridCardDescription>
            </PluginGridCardHeading>
            <PluginGridCardToggle>
              <Switch disabled aria-label="Enable Polarsteps" />
            </PluginGridCardToggle>
          </PluginGridCardTop>
          <PluginGridCardFooter>
            <PluginGridCardFooterRow>
              <PluginGridCardActions />
            </PluginGridCardFooterRow>
          </PluginGridCardFooter>
        </PluginGridCard>
      </PluginGrid>
    </StoryFrame>
  ),
};

export const ListRow: Story = {
  parameters: storyDocs("Legacy list row layout (still exported for reuse)."),
  render: () => (
    <StoryFrame width="md">
      <PluginListRow>
        <PluginListRowMain>
          <PluginListRowInfo>
            <PluginListRowTitle
              icon={
                <PluginListIcon>
                  <PluginIconFrame size={4}>
                    <span aria-hidden>🎵</span>
                  </PluginIconFrame>
                </PluginListIcon>
              }
            >
              Spotify
            </PluginListRowTitle>
            <PluginListRowDescription>
              Add top tracks for each pin&apos;s dates.
            </PluginListRowDescription>
          </PluginListRowInfo>
        </PluginListRowMain>
        <PluginListRowToggle
          label="Enabled"
          control={<Switch defaultChecked aria-label="Enable Spotify" />}
        />
      </PluginListRow>
    </StoryFrame>
  ),
};
