import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Button } from "../button";
import { StoryFrame } from "../../storybook/story-frame";
import {
  PluginAccountBody,
  PluginAccountHeading,
  PluginAccountMuted,
  PluginAccountName,
  PluginAccountPanel,
  PluginAccountRow,
  pluginAccountButtonClass,
} from "./plugin-account";

const meta = {
  title: "Components/Plugin Account",
  ...componentStoryMeta(
    `OAuth account panel layout for plugin settings.`,
    `Wrap plugin-specific copy in \`PluginAccountPanel\`. Use \`pluginAccountButtonClass\` on outline buttons.`,
  ),
  component: PluginAccountPanel,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Linked OAuth account with disconnect action."),
  render: () => (
    <StoryFrame width="md">
      <PluginAccountPanel>
        <PluginAccountHeading>Account</PluginAccountHeading>
        <PluginAccountRow>
          <PluginAccountBody>
            Signed in as <PluginAccountName>demo_user</PluginAccountName>
          </PluginAccountBody>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={pluginAccountButtonClass}
          >
            Disconnect
          </Button>
        </PluginAccountRow>
      </PluginAccountPanel>
    </StoryFrame>
  ),
};

export const Unlinked: Story = {
  parameters: storyDocs("Prompt to link an OAuth provider."),
  render: () => (
    <StoryFrame width="md">
      <PluginAccountPanel>
        <PluginAccountHeading>Account</PluginAccountHeading>
        <PluginAccountRow gap="sm">
          <PluginAccountMuted>
            Connect Spotify to add top tracks you listened to during each
            trace&apos;s dates (as links).
          </PluginAccountMuted>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={pluginAccountButtonClass}
          >
            Link Spotify
          </Button>
        </PluginAccountRow>
      </PluginAccountPanel>
    </StoryFrame>
  ),
};

export const Compact: Story = {
  parameters: storyDocs("Compact panel when OAuth is unavailable."),
  render: () => (
    <StoryFrame width="md">
      <PluginAccountPanel compact>
        <PluginAccountMuted>
          OAuth is not configured for this environment.
        </PluginAccountMuted>
      </PluginAccountPanel>
    </StoryFrame>
  ),
};
