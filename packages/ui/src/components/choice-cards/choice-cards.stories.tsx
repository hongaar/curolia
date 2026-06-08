import type { Meta, StoryObj } from "@storybook/react";
import { Bookmark, Star } from "lucide-react";
import { useStoryArgs } from "../../storybook/args";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { ChoiceCard, ChoiceCards } from "./choice-cards";

/** Demo-only arg; not a prop on `ChoiceCards`. */
type MapStyleDemoArgs = {
  value: "auto" | "street" | "satellite";
};

type SourceDemoArgs = {
  value: "starred" | "collection";
};

const meta = {
  title: "Choice cards",
  ...componentStoryMeta(
    "Image-or-button radio group for picking one option from a small set.",
    "Wrap options in `ChoiceCards` with a typed `value` / `onValueChange`. Each `ChoiceCard` accepts a label, optional description, and either `previewSrc`, `previewIcon` + `previewTone`, or custom `preview` content.",
  ),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Basic text cards without preview imagery."),
  render: function Render() {
    const [{ value }, updateArgs] = useStoryArgs<MapStyleDemoArgs>();

    return (
      <StoryFrame width="lg">
        <ChoiceCards
          name="map-style-demo"
          value={value}
          onValueChange={(next) => updateArgs({ value: next })}
        >
          <ChoiceCard
            value="auto"
            label="Auto"
            description="Light or dark based on theme"
          />
          <ChoiceCard
            value="street"
            label="Street"
            description="Detailed streets and labels"
          />
          <ChoiceCard
            value="satellite"
            label="Satellite"
            description="Aerial imagery"
          />
        </ChoiceCards>
      </StoryFrame>
    );
  },
};

export const IconAccent: Story = {
  parameters: storyDocs(
    "Icon preview with tinted background (`previewIcon` + `previewTone`).",
  ),
  render: function Render() {
    const [{ value }, updateArgs] = useStoryArgs<SourceDemoArgs>();

    return (
      <StoryFrame width="lg">
        <ChoiceCards
          name="source-kind-demo"
          value={value}
          onValueChange={(next) => updateArgs({ value: next })}
        >
          <ChoiceCard
            value="starred"
            label="Starred places"
            description="Global favorites on Google Maps"
            previewTone="yellow"
            previewIcon={<Star strokeWidth={1.75} />}
          />
          <ChoiceCard
            value="collection"
            label="Saved list"
            description="One of your custom lists"
            previewTone="green"
            previewIcon={<Bookmark strokeWidth={1.75} />}
          />
        </ChoiceCards>
      </StoryFrame>
    );
  },
};

export const Disabled: Story = {
  parameters: storyDocs("Read-only state for viewers without edit permission."),
  render: () => (
    <StoryFrame width="lg">
      <ChoiceCards
        name="map-style-disabled"
        value="street"
        onValueChange={() => {}}
        disabled
      >
        <ChoiceCard value="auto" label="Auto" description="Light or dark" />
        <ChoiceCard
          value="street"
          label="Street"
          description="Detailed streets"
        />
        <ChoiceCard
          value="satellite"
          label="Satellite"
          description="Aerial imagery"
        />
      </ChoiceCards>
    </StoryFrame>
  ),
};
