import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "../dropdown-menu";
import { MapPickerContent, MapPickerTrigger } from "./map-picker";

const meta = {
  title: "Map Picker",
  ...componentStoryMeta(
    "Dropdown trigger for switching maps (sits beside the Curolia brand in the main toolbar).",
    "Wrap in `DropdownMenu`; pair `MapPickerTrigger` with `MapPickerContent`.",
  ),
  component: MapPickerTrigger,
} satisfies Meta<typeof MapPickerTrigger>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Active map with emoji and name."),
  render: () => (
    <DropdownMenu>
      <MapPickerTrigger
        mapEmoji="🗺️"
        mapName="Summer trip"
        aria-label="Select map"
      />
      <MapPickerContent>
        <DropdownMenuLabel>Maps</DropdownMenuLabel>
        <DropdownMenuItem>Personal</DropdownMenuItem>
        <DropdownMenuItem>Summer trip</DropdownMenuItem>
        <DropdownMenuItem>New map…</DropdownMenuItem>
      </MapPickerContent>
    </DropdownMenu>
  ),
};

export const LongName: Story = {
  parameters: storyDocs("Long map names truncate inside the pill."),
  render: () => (
    <DropdownMenu>
      <MapPickerTrigger
        mapEmoji="🏕️"
        mapName="Vanlife Europe 2026 — west coast"
        aria-label="Select map"
      />
      <MapPickerContent>
        <Button variant="ghost" size="sm">
          …
        </Button>
      </MapPickerContent>
    </DropdownMenu>
  ),
};
