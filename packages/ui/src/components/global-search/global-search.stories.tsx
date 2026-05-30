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

const meta = {
  title: "Components/Global Search",
  ...componentStoryMeta(
    `Search input and result row styling for the main toolbar.`,
    `Embed inside \`MainToolbarSearchSlot\`; connect popover content to search results.`,
  ),
  component: GlobalSearchPopoverTrigger,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Toolbar search trigger with input and result rows."),
  render: () => (
    <SearchPopover defaultOpen>
      <GlobalSearchPopoverTrigger title="Search">
        <Search aria-hidden />
        <span>Search</span>
      </GlobalSearchPopoverTrigger>
      <GlobalSearchPopoverContent>
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
      </GlobalSearchPopoverContent>
    </SearchPopover>
  ),
};
