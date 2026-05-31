import type { Meta, StoryObj } from "@storybook/react";
import { Menu } from "lucide-react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Input } from "../input";
import {
  MainToolbarBrand,
  MainToolbarMenuButton,
  MainToolbarMenuIcon,
  MainToolbarSearchSlot,
  MainToolbarShell,
} from "./main-toolbar-panel";

const meta = {
  title: "Main Toolbar",
  ...componentStoryMeta(
    `Floating toolbar shell: menu, brand, search slot.`,
    `Compose \`MainToolbarShell\` with menu button, \`MainToolbarBrand\`, and \`MainToolbarSearchSlot\`.`,
  ),
  component: MainToolbarShell,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Toolbar shell with menu, brand, and search slot."),
  render: () => (
    <MainToolbarShell>
      <MainToolbarMenuButton aria-label="Menu">
        <MainToolbarMenuIcon>
          <Menu aria-hidden />
        </MainToolbarMenuIcon>
      </MainToolbarMenuButton>
      <MainToolbarBrand>Curolia</MainToolbarBrand>
      <MainToolbarSearchSlot>
        <Input placeholder="Search traces…" aria-label="Search" />
      </MainToolbarSearchSlot>
    </MainToolbarShell>
  ),
};
