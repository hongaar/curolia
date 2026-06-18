import type { Meta, StoryObj } from "@storybook/react";
import { Calendar, Images, MapPin } from "lucide-react";

import { componentStoryMeta } from "../../storybook/docs";
import { CardMeta, CardMetaEmojiIcon, CardMetaItem } from "./card-meta";

const meta = {
  title: "Card meta",
  component: CardMeta,
  ...componentStoryMeta(
    "Muted metadata rows for cards and list rows.",
    "Use on pin cards, map cards, and blog pin entries. Items are separated by a vertical divider.",
  ),
} satisfies Meta<typeof CardMeta>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PinCardStyle: Story = {
  render: () => (
    <CardMeta>
      <CardMetaItem icon={<Calendar aria-hidden />}>Jun 12, 2024</CardMetaItem>
      <CardMetaItem icon={<Images aria-hidden />}>8 photos</CardMetaItem>
    </CardMeta>
  ),
};

export const MapCardStyle: Story = {
  render: () => (
    <CardMeta>
      <CardMetaItem icon={<MapPin aria-hidden />}>42 pins</CardMetaItem>
      <CardMetaItem>Updated 3d ago</CardMetaItem>
    </CardMeta>
  ),
};

export const InteractionSummary: Story = {
  render: () => (
    <CardMeta>
      <CardMetaItem icon={<CardMetaEmojiIcon emoji="❤️" />}>2</CardMetaItem>
      <CardMetaItem icon={<CardMetaEmojiIcon emoji="👍" />}>1</CardMetaItem>
      <CardMetaItem>3 comments</CardMetaItem>
    </CardMeta>
  ),
};
