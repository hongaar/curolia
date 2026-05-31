import type { Meta, StoryObj } from "@storybook/react";
import { Music } from "lucide-react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame, storyFrameStyles } from "../../storybook/story-frame";
import { Button } from "../button";
import { PluginIconFrame } from "../plugin-icon-frame";
import {
  PluginTraceCard,
  PluginTraceContent,
  PluginTraceError,
  PluginTraceHeader,
  PluginTraceLink,
  PluginTraceLinkMeta,
  PluginTraceList,
  PluginTraceMutedStack,
  PluginTraceMutedXs,
  PluginTraceSpinner,
  PluginTraceTitleRow,
} from "./plugin-trace";

const meta = {
  title: "Plugin Trace",
  ...componentStoryMeta(
    `Trace detail card chrome for plugin contributions.`,
    `Use \`PluginTraceCard\` with header/title row and \`PluginTraceLink\` list items for external links.`,
  ),
  component: PluginTraceCard,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Trace plugin card with external track links."),
  render: () => (
    <StoryFrame width="md">
      <PluginTraceCard>
        <PluginTraceHeader>
          <PluginTraceTitleRow
            icon={
              <PluginIconFrame size={4}>
                <Music aria-hidden className={storyFrameStyles.iconSm} />
              </PluginIconFrame>
            }
            title="Spotify"
          />
        </PluginTraceHeader>
        <PluginTraceContent>
          <PluginTraceList>
            <PluginTraceLink
              href="https://example.com/track/1"
              icon={<Music aria-hidden className={storyFrameStyles.iconSm} />}
            >
              <span>
                Song title
                <PluginTraceLinkMeta> · 3×</PluginTraceLinkMeta>
              </span>
            </PluginTraceLink>
          </PluginTraceList>
        </PluginTraceContent>
      </PluginTraceCard>
    </StoryFrame>
  ),
};

export const Loading: Story = {
  parameters: storyDocs("Loading state with spinner."),
  render: () => (
    <StoryFrame width="md">
      <PluginTraceCard>
        <PluginTraceHeader>
          <PluginTraceTitleRow
            icon={
              <PluginIconFrame size={4}>
                <span aria-hidden>📷</span>
              </PluginIconFrame>
            }
            title="Google Photos"
          />
        </PluginTraceHeader>
        <PluginTraceContent>
          <PluginTraceSpinner />
          <PluginTraceMutedXs>Loading suggestions…</PluginTraceMutedXs>
        </PluginTraceContent>
      </PluginTraceCard>
    </StoryFrame>
  ),
};

export const ErrorState: Story = {
  parameters: storyDocs("Error message and retry action."),
  render: () => (
    <StoryFrame width="md">
      <PluginTraceCard>
        <PluginTraceHeader>
          <PluginTraceTitleRow
            icon={
              <PluginIconFrame size={4}>
                <span aria-hidden>📷</span>
              </PluginIconFrame>
            }
            title="Google Photos"
          />
        </PluginTraceHeader>
        <PluginTraceContent>
          <PluginTraceMutedStack>
            <PluginTraceError>
              Could not load photo suggestions.
            </PluginTraceError>
            <PluginTraceMutedXs>
              Check your connection and try again.
            </PluginTraceMutedXs>
          </PluginTraceMutedStack>
          <Button size="sm" variant="outline">
            Retry
          </Button>
        </PluginTraceContent>
      </PluginTraceCard>
    </StoryFrame>
  ),
};
