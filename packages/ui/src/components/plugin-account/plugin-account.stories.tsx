import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import {
  PluginAccountBody,
  PluginAccountButton,
  PluginAccountHeading,
  PluginAccountInput,
  PluginAccountInputDescription,
  PluginAccountInputRow,
  PluginAccountMuted,
  PluginAccountName,
  PluginAccountPanel,
  PluginAccountRow,
} from "./plugin-account";

const meta = {
  title: "Plugin Account",
  ...componentStoryMeta(
    `OAuth account panel layout for plugin settings.`,
    `Wrap plugin-specific copy in \`PluginAccountPanel\`. Use \`PluginAccountButton\` for actions.`,
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
          <PluginAccountButton type="button">Disconnect</PluginAccountButton>
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
          <PluginAccountButton type="button">Link Spotify</PluginAccountButton>
        </PluginAccountRow>
      </PluginAccountPanel>
    </StoryFrame>
  ),
};

export const UsernameField: Story = {
  parameters: storyDocs("Manual username entry (e.g. Last.fm)."),
  render: () => (
    <StoryFrame width="md">
      <PluginAccountPanel>
        <PluginAccountHeading>Account</PluginAccountHeading>
        <PluginAccountInputDescription>
          <PluginAccountMuted>
            Enter your public Last.fm username. Scrobbles are read from
            Last.fm&apos;s API.
          </PluginAccountMuted>
        </PluginAccountInputDescription>
        <PluginAccountInputRow>
          <PluginAccountInput
            type="text"
            autoComplete="off"
            placeholder="Last.fm username"
          />
          <PluginAccountButton type="button">Save</PluginAccountButton>
        </PluginAccountInputRow>
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
