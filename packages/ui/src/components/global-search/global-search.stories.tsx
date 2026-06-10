import type { Meta, StoryObj } from "@storybook/react";
import { Search } from "lucide-react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Popover as SearchPopover } from "../popover";
import {
  GlobalSearchIcon,
  GlobalSearchInput,
  GlobalSearchPopoverContent,
  GlobalSearchPopoverTrigger,
  GlobalSearchResultBody,
  GlobalSearchResultRow,
  GlobalSearchResults,
  GlobalSearchResultSubtitle,
  GlobalSearchResultTitle,
  GlobalSearchToolbarAnchor,
  GlobalSearchToolbarField,
} from "./global-search";

const searchResultsList = (
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
);

const searchResultsStandalone = (
  <>
    <GlobalSearchInput placeholder="Search pins…" />
    {searchResultsList}
  </>
);

const meta = {
  title: "Global Search",
  ...componentStoryMeta(
    `Search input and result row styling for the main toolbar.`,
    `Embed with \`Popover\` + \`GlobalSearchToolbarAnchor\`; see Popover → Anchor input story.`,
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
      <GlobalSearchPopoverContent>
        {searchResultsStandalone}
      </GlobalSearchPopoverContent>
    </SearchPopover>
  ),
};

export const ToolbarEmbed: Story = {
  parameters: storyDocs(
    "Toolbar slot: input in `GlobalSearchToolbarAnchor`, results in `GlobalSearchPopoverContent`.",
  ),
  render: () => (
    <SearchPopover defaultOpen modal={false}>
      <GlobalSearchToolbarAnchor>
        <GlobalSearchToolbarField focused>
          <GlobalSearchIcon>
            <Search aria-hidden />
          </GlobalSearchIcon>
          <GlobalSearchInput variant="toolbar" placeholder="Search…" />
        </GlobalSearchToolbarField>
      </GlobalSearchToolbarAnchor>
      <GlobalSearchPopoverContent toolbarEmbed>
        {searchResultsList}
      </GlobalSearchPopoverContent>
    </SearchPopover>
  ),
};

export const Title: Story = {
  parameters: storyDocs("Custom `title` tooltip on the trigger button."),
  args: {
    title: "Search your map (⌘K)",
    toolbarEmbed: false,
  },
  render: (args) => (
    <SearchPopover>
      <GlobalSearchPopoverTrigger {...args} />
      <GlobalSearchPopoverContent>
        {searchResultsStandalone}
      </GlobalSearchPopoverContent>
    </SearchPopover>
  ),
};

export const ResultStates: Story = {
  parameters: storyDocs(
    "Focus (keyboard/hover highlight) vs selected (confirmed pick) row styles.",
  ),
  render: () => (
    <GlobalSearchResults>
      <GlobalSearchResultRow onClick={() => undefined}>
        <GlobalSearchResultBody>
          <GlobalSearchResultTitle>Default row</GlobalSearchResultTitle>
          <GlobalSearchResultSubtitle>No highlight</GlobalSearchResultSubtitle>
        </GlobalSearchResultBody>
      </GlobalSearchResultRow>
      <GlobalSearchResultRow active onClick={() => undefined}>
        <GlobalSearchResultBody>
          <GlobalSearchResultTitle>Focused row</GlobalSearchResultTitle>
          <GlobalSearchResultSubtitle>
            Keyboard or pointer highlight
          </GlobalSearchResultSubtitle>
        </GlobalSearchResultBody>
      </GlobalSearchResultRow>
      <GlobalSearchResultRow selected onClick={() => undefined}>
        <GlobalSearchResultBody>
          <GlobalSearchResultTitle>Selected row</GlobalSearchResultTitle>
          <GlobalSearchResultSubtitle>
            Confirmed pick
          </GlobalSearchResultSubtitle>
        </GlobalSearchResultBody>
      </GlobalSearchResultRow>
      <GlobalSearchResultRow active selected onClick={() => undefined}>
        <GlobalSearchResultBody>
          <GlobalSearchResultTitle>Focused + selected</GlobalSearchResultTitle>
          <GlobalSearchResultSubtitle>
            Both states combined
          </GlobalSearchResultSubtitle>
        </GlobalSearchResultBody>
      </GlobalSearchResultRow>
    </GlobalSearchResults>
  ),
};
