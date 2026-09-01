import type { Meta, StoryObj } from "@storybook/react";
import { useStoryArgs } from "../../storybook/args";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Badge } from "../badge";
import { Button } from "../button";
import { PageHeader, PageHeaderLead, PageHeaderTitle } from "../page";
import { PluginIconFrame } from "../plugin-icon-frame";
import { Stack } from "../stack";
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
  PluginGridSection,
  PluginGridSectionBody,
  PluginGridSectionHeader,
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
    `Each plugin is a \`PluginGridCard\` with icon, title, description, and actions.`,
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
              <PluginIconFrame size={5}>
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
              <PluginIconFrame size={5}>
                <span aria-hidden>📖</span>
              </PluginIconFrame>
            </PluginGridCardIcon>
            <PluginGridCardHeading>
              <PluginGridCardTitle>Last.fm</PluginGridCardTitle>
              <PluginGridCardDescription>
                Listening history on pin dates.
              </PluginGridCardDescription>
            </PluginGridCardHeading>
            <PluginGridCardToggle>
              <Switch defaultChecked aria-label="Enable Last.fm" />
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
              <PluginIconFrame size={5}>
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
              <PluginIconFrame size={5}>
                <span aria-hidden>📍</span>
              </PluginIconFrame>
            </PluginGridCardIcon>
            <PluginGridCardHeading>
              <PluginGridCardTitle>Polarsteps</PluginGridCardTitle>
              <PluginGridCardDescription>
                Let map visitors leave comments on pins. Optionally allow
                signed-out visitors to comment on public maps.
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

export const ExperimentalSection: Story = {
  parameters: storyDocs(
    "Optional plugins stay collapsed at the bottom until the disclosure is opened.",
  ),
  args: { expanded: false },
  render: function Render() {
    const [{ expanded }, updateArgs] = useStoryArgs<{ expanded: boolean }>();
    return (
      <StoryFrame width="2xl">
        <Stack gap="md">
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
                  <PluginIconFrame size={5}>
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
          </PluginGrid>
          <PluginGridSection label="Experimental plugins">
            <PluginGridSectionHeader
              expanded={expanded}
              controls="story-experimental-plugins"
              onClick={() => updateArgs({ expanded: !expanded })}
            >
              Show experimental plugins
            </PluginGridSectionHeader>
            {expanded ? (
              <PluginGridSectionBody id="story-experimental-plugins">
                <PluginGrid>
                  <PluginGridCard>
                    <PluginGridCardTop>
                      <PluginGridCardIcon>
                        <PluginIconFrame size={5}>
                          <span aria-hidden>📖</span>
                        </PluginIconFrame>
                      </PluginGridCardIcon>
                      <PluginGridCardHeading>
                        <PluginGridCardTitle
                          badge={
                            <Badge variant="secondary">Experimental</Badge>
                          }
                        >
                          Wikipedia
                        </PluginGridCardTitle>
                        <PluginGridCardDescription>
                          Nearby landmarks and Wikipedia articles on pins.
                        </PluginGridCardDescription>
                      </PluginGridCardHeading>
                      <PluginGridCardToggle>
                        <Switch defaultChecked aria-label="Enable Wikipedia" />
                      </PluginGridCardToggle>
                    </PluginGridCardTop>
                    <PluginGridCardFooter>
                      <PluginGridCardFooterRow>
                        <PluginGridCardActions>
                          <PluginGridCardConfigureButton
                            onClick={() => undefined}
                          />
                        </PluginGridCardActions>
                      </PluginGridCardFooterRow>
                    </PluginGridCardFooter>
                  </PluginGridCard>
                </PluginGrid>
              </PluginGridSectionBody>
            ) : null}
          </PluginGridSection>
        </Stack>
      </StoryFrame>
    );
  },
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
                  <PluginIconFrame size={5}>
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
