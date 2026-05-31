import type { Meta, StoryObj } from "@storybook/react";
import { Search } from "lucide-react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Popover as SearchPopover } from "../popover";
import {
  GlobalSearchInput,
  GlobalSearchPopoverContent,
  GlobalSearchPopoverTrigger,
  GlobalSearchResultBody,
  GlobalSearchResultRow,
  GlobalSearchResults,
  GlobalSearchResultSubtitle,
  GlobalSearchResultTitle,
} from "./global-search";

const searchResults = (
  <>
    <GlobalSearchInput placeholder="Search traces…" />
    <GlobalSearchResults>
      <GlobalSearchResultRow onClick={() => undefined}>
        <GlobalSearchResultBody>
          <GlobalSearchResultTitle>Café de Flore</GlobalSearchResultTitle>
          <GlobalSearchResultSubtitle>
            Paris · 3 photos
          </GlobalSearchResultSubtitle>
        </GlobalSearchResultBody>
      </GlobalSearchResultRow>
      <GlobalSearchResultRow onClick={() => undefined}>
        <GlobalSearchResultBody>
          <GlobalSearchResultTitle>Louvre Museum</GlobalSearchResultTitle>
          <GlobalSearchResultSubtitle>
            Paris · 12 photos
          </GlobalSearchResultSubtitle>
        </GlobalSearchResultBody>
      </GlobalSearchResultRow>
    </GlobalSearchResults>
  </>
);

const meta = {
  title: "Global Search",
  ...componentStoryMeta(
    `Search input and result row styling for the main toolbar.`,
    `Embed inside \`MainToolbarSearchSlot\`; connect popover content to search results.`,
  ),
  component: GlobalSearchPopoverTrigger,
  args: {
    title: "Search",
    toolbarEmbed: false,
    children: (
      <>
        <Search aria-hidden />
        <span>Search</span>
      </>
    ),
  },
} satisfies Meta<typeof GlobalSearchPopoverTrigger>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs(
    "Standalone outline trigger with popover input and result rows.",
  ),
  render: (args) => (
    <SearchPopover defaultOpen>
      <GlobalSearchPopoverTrigger {...args} />
      <GlobalSearchPopoverContent>{searchResults}</GlobalSearchPopoverContent>
    </SearchPopover>
  ),
};

export const ToolbarEmbed: Story = {
  parameters: storyDocs(
    "`toolbarEmbed` uses ghost styling for the main toolbar slot.",
  ),
  args: {
    toolbarEmbed: true,
    title: "Search traces",
  },
  render: (args) => (
    <SearchPopover defaultOpen>
      <GlobalSearchPopoverTrigger {...args} />
      <GlobalSearchPopoverContent>{searchResults}</GlobalSearchPopoverContent>
    </SearchPopover>
  ),
};

export const Title: Story = {
  parameters: storyDocs("Custom `title` tooltip on the trigger button."),
  args: {
    title: "Search your journal (⌘K)",
    toolbarEmbed: false,
  },
  render: (args) => (
    <SearchPopover>
      <GlobalSearchPopoverTrigger {...args} />
      <GlobalSearchPopoverContent>{searchResults}</GlobalSearchPopoverContent>
    </SearchPopover>
  ),
};
