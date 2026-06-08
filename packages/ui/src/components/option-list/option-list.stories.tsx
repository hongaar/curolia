import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Checkbox } from "../checkbox";
import { OptionList, OptionListItem } from "./option-list";

const meta = {
  title: "Option List",
  ...componentStoryMeta(
    `Scrollable bordered box of checkbox option rows.`,
    `Use \`OptionListItem\` as a \`<label>\` wrapping a \`Checkbox\` and option label content.`,
  ),
  component: OptionList,
  decorators: [
    (Story) => (
      <StoryFrame width="md">
        <Story />
      </StoryFrame>
    ),
  ],
} satisfies Meta<typeof OptionList>;

export default meta;
type Story = StoryObj<typeof meta>;

const TAGS = [
  { id: "food", emoji: "🍽️", name: "Food" },
  { id: "stay", emoji: "🏨", name: "Stay" },
  { id: "sight", emoji: "📸", name: "Sightseeing" },
  { id: "shop", emoji: "🛍️", name: "Shopping" },
  { id: "nature", emoji: "🌿", name: "Nature" },
  { id: "night", emoji: "🌙", name: "Nightlife" },
] as const;

export const Default: Story = {
  parameters: storyDocs("Typical pin tag picker with emoji + name rows."),
  render: function Render() {
    const [selected, setSelected] = useState<ReadonlySet<string>>(
      () => new Set(["food", "sight"]),
    );

    return (
      <OptionList>
        {TAGS.map((tag) => (
          <OptionListItem key={tag.id}>
            <Checkbox
              checked={selected.has(tag.id)}
              onCheckedChange={(checked) => {
                setSelected((prev) => {
                  const next = new Set(prev);
                  if (checked === true) next.add(tag.id);
                  else next.delete(tag.id);
                  return next;
                });
              }}
            />
            <span>{tag.emoji}</span>
            <span>{tag.name}</span>
          </OptionListItem>
        ))}
      </OptionList>
    );
  },
};

export const Empty: Story = {
  parameters: storyDocs(
    "Empty list — pair with field description copy in the parent.",
  ),
  render: () => <OptionList />,
};
