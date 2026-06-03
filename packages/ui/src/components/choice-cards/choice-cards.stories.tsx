import type { Meta, StoryObj } from "@storybook/react";
import { useStoryArgs } from "../../storybook/args";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { ChoiceCard, ChoiceCards } from "./choice-cards";

/** Demo-only arg; not a prop on `ChoiceCards`. */
type MapStyleDemoArgs = {
  value: "auto" | "street" | "satellite";
};

const meta = {
  title: "Choice cards",
  ...componentStoryMeta(
    "Image-or-button radio group for picking one option from a small set.",
    "Wrap options in `ChoiceCards` with a typed `value` / `onValueChange`. Each `ChoiceCard` accepts a label, optional description, and either `previewSrc` or custom `preview` content.",
  ),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const MapStyle: Story = {
  parameters: storyDocs(
    "Map style picker pattern with placeholder previews until assets are added.",
  ),
  args: {
    value: "auto",
  } as Story["args"],
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
