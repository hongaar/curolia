import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import { Switch } from "../switch";
import { StoryFrame } from "../../storybook/story-frame";
import {
  PluginFeedCode,
  PluginFeedLabel,
  PluginFeedRow,
  PluginMutedBox,
  PluginRow,
  PluginSection,
  PluginSettingsBox,
  PluginSettingsHint,
  PluginSettingsRow,
  PluginSettingsTitle,
  PluginStatusText,
} from "./plugin-panel";

const meta = {
  title: "Components/Plugin Panel",
  ...componentStoryMeta(
    `Sections, settings boxes, and feed rows for plugin configuration.`,
    `Stack \`PluginSection\` blocks; use \`PluginSettingsBox\` for grouped fields and \`PluginFeedRow\` for URLs.`,
  ),
  component: PluginSection,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Plugin settings section with a toggle row."),
  render: () => (
    <StoryFrame width="md">
      <PluginSection>
        <PluginSettingsTitle>Sync</PluginSettingsTitle>
        <PluginSettingsBox>
          <PluginSettingsRow>
            <PluginSettingsHint>Enable automatic sync</PluginSettingsHint>
            <Switch defaultChecked aria-label="Enable sync" />
          </PluginSettingsRow>
        </PluginSettingsBox>
        <PluginStatusText>Last synced 2 hours ago.</PluginStatusText>
      </PluginSection>
    </StoryFrame>
  ),
};
