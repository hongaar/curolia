import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Button } from "../button";
import { Switch } from "../switch";
import { StoryFrame } from "../../storybook/story-frame";
import { PluginIconFrame } from "../plugin-icon-frame";
import {
  PluginListHeader,
  PluginListIcon,
  PluginListRow,
  PluginListRowDescription,
  PluginListRowHint,
  PluginListRowInfo,
  PluginListRowMain,
  PluginListRowTitle,
  PluginListRowToggle,
} from "./plugins";

const meta = {
  title: "Components/Plugins",
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
          <PluginListIcon>
            <PluginIconFrame size={5}>
              <span aria-hidden>🎵</span>
            </PluginIconFrame>
          </PluginListIcon>
          <PluginListRowInfo>
            <PluginListRowTitle>Spotify</PluginListRowTitle>
            <PluginListRowDescription>
              Add top tracks for each trace&apos;s dates.
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
