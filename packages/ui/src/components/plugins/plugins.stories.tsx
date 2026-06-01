import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { PluginIconFrame } from "../plugin-icon-frame";
import { Switch } from "../switch";
import {
  PluginListHeader,
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
    `Plugin list rows for the global plugins settings page.`,
    `Each plugin is a \`PluginListRow\` with icon, title, description, and toggle or action.`,
  ),
  component: PluginListRow,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Plugin list row with icon, title, and toggle."),
  render: () => (
    <StoryFrame width="md">
      <PluginListHeader>Plugins</PluginListHeader>
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
