import type { Meta, StoryObj } from "@storybook/react";
import { Music } from "lucide-react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame, storyFrameStyles } from "../../storybook/story-frame";
import { Button } from "../button";
import { PluginIconFrame } from "../plugin-icon-frame";
import {
  PluginPinCard,
  PluginPinContent,
  PluginPinError,
  PluginPinHeader,
  PluginPinLink,
  PluginPinLinkMeta,
  PluginPinList,
  PluginPinMutedStack,
  PluginPinMutedXs,
  PluginPinSpinner,
  PluginPinTitleRow,
} from "./plugin-pin";

const meta = {
  title: "Plugin Pin",
  ...componentStoryMeta(
    `Pin detail card chrome for plugin contributions.`,
    `Use \`PluginPinCard\` with header/title row and \`PluginPinLink\` list items for external links.`,
  ),
  component: PluginPinCard,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Pin plugin card with external track links."),
  render: () => (
    <StoryFrame width="md">
      <PluginPinCard>
        <PluginPinHeader>
          <PluginPinTitleRow
            icon={
              <PluginIconFrame size={4}>
                <Music aria-hidden className={storyFrameStyles.iconSm} />
              </PluginIconFrame>
            }
            title="Spotify"
          />
        </PluginPinHeader>
        <PluginPinContent>
          <PluginPinList>
            <PluginPinLink
              href="https://example.com/track/1"
              icon={<Music aria-hidden className={storyFrameStyles.iconSm} />}
            >
              <span>
                Song title
                <PluginPinLinkMeta> · 3×</PluginPinLinkMeta>
              </span>
            </PluginPinLink>
          </PluginPinList>
        </PluginPinContent>
      </PluginPinCard>
    </StoryFrame>
  ),
};

export const Loading: Story = {
  parameters: storyDocs("Loading state with spinner."),
  render: () => (
    <StoryFrame width="md">
      <PluginPinCard>
        <PluginPinHeader>
          <PluginPinTitleRow
            icon={
              <PluginIconFrame size={4}>
                <span aria-hidden>📷</span>
              </PluginIconFrame>
            }
            title="Google Photos"
          />
        </PluginPinHeader>
        <PluginPinContent>
          <PluginPinSpinner />
          <PluginPinMutedXs>Loading suggestions…</PluginPinMutedXs>
        </PluginPinContent>
      </PluginPinCard>
    </StoryFrame>
  ),
};

export const ErrorState: Story = {
  parameters: storyDocs("Error message and retry action."),
  render: () => (
    <StoryFrame width="md">
      <PluginPinCard>
        <PluginPinHeader>
          <PluginPinTitleRow
            icon={
              <PluginIconFrame size={4}>
                <span aria-hidden>📷</span>
              </PluginIconFrame>
            }
            title="Google Photos"
          />
        </PluginPinHeader>
        <PluginPinContent>
          <PluginPinMutedStack>
            <PluginPinError>Could not load photo suggestions.</PluginPinError>
            <PluginPinMutedXs>
              Check your connection and try again.
            </PluginPinMutedXs>
          </PluginPinMutedStack>
          <Button size="sm" variant="outline">
            Retry
          </Button>
        </PluginPinContent>
      </PluginPinCard>
    </StoryFrame>
  ),
};
