import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { PinDetailSubtitle } from "../pin-detail";
import {
  PinMetadataSubtitleContent,
  type PinMetadataSubtitle,
} from "./pin-metadata-subtitle";

const meta = {
  title: "Pin Metadata Subtitle",
  ...componentStoryMeta(
    `Composable subtitle parts for pin headers and map popovers.`,
    `Build a \`PinMetadataSubtitle\` from \`parts\` and render with \`PinMetadataSubtitleContent\`. Text parts join with middle dots; icon parts use status styling.`,
  ),
  component: PinMetadataSubtitleContent,
} satisfies Meta;

export default meta;
type Story = StoryObj;

function SubtitleDemo({ subtitle }: { subtitle: PinMetadataSubtitle }) {
  return (
    <StoryFrame width="md">
      <PinDetailSubtitle>
        <PinMetadataSubtitleContent subtitle={subtitle} />
      </PinDetailSubtitle>
    </StoryFrame>
  );
}

export const TextOnly: Story = {
  parameters: storyDocs('`kind: "text"` parts joined with middle dots.'),
  render: () => (
    <SubtitleDemo
      subtitle={{
        parts: [
          { kind: "text", text: "Paris" },
          { kind: "text", text: "12 Jun 2025" },
          { kind: "text", text: "18°C" },
        ],
      }}
    />
  ),
};

export const WheelchairFriendly: Story = {
  parameters: storyDocs('`kind: "wheelchair_friendly"` with check icon.'),
  render: () => (
    <SubtitleDemo subtitle={{ parts: [{ kind: "wheelchair_friendly" }] }} />
  ),
};

export const WheelchairLimited: Story = {
  parameters: storyDocs('`kind: "wheelchair_limited"` plain text.'),
  render: () => (
    <SubtitleDemo subtitle={{ parts: [{ kind: "wheelchair_limited" }] }} />
  ),
};

export const WheelchairNo: Story = {
  parameters: storyDocs('`kind: "wheelchair_no"` with cross icon.'),
  render: () => (
    <SubtitleDemo subtitle={{ parts: [{ kind: "wheelchair_no" }] }} />
  ),
};

export const DogsWelcome: Story = {
  parameters: storyDocs('`kind: "dogs_welcome"` with check icon.'),
  render: () => (
    <SubtitleDemo subtitle={{ parts: [{ kind: "dogs_welcome" }] }} />
  ),
};

export const NoDogs: Story = {
  parameters: storyDocs('`kind: "no_dogs"` with cross icon.'),
  render: () => <SubtitleDemo subtitle={{ parts: [{ kind: "no_dogs" }] }} />,
};

export const MixedSubtitle: Story = {
  parameters: storyDocs("Text mixed with accessibility and dog policy parts."),
  render: () => (
    <SubtitleDemo
      subtitle={{
        parts: [
          { kind: "text", text: "Café" },
          { kind: "wheelchair_friendly" },
          { kind: "dogs_welcome" },
        ],
      }}
    />
  ),
};
