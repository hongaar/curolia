import type { Meta, StoryObj } from "@storybook/react";
import { Search as SearchGlyph } from "lucide-react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Popover as SearchPopover } from "../popover";
import {
  SearchEmptyHint,
  SearchIcon,
  SearchInput,
  SearchPopoverContent,
  SearchResultBody,
  SearchResultRow,
  SearchResults,
  SearchResultSubtitle,
  SearchResultTitle,
  SearchSectionLabel,
  SearchToolbarAnchor,
  SearchToolbarField,
  SearchToolbarShortcutHint,
} from "./search";

const sampleResults = (
  <SearchResults>
    <SearchSectionLabel>Places</SearchSectionLabel>
    <SearchResultRow onClick={() => undefined}>
      <SearchResultBody>
        <SearchResultTitle>Café de Flore</SearchResultTitle>
        <SearchResultSubtitle>Paris, France</SearchResultSubtitle>
      </SearchResultBody>
    </SearchResultRow>
    <SearchResultRow onClick={() => undefined}>
      <SearchResultBody>
        <SearchResultTitle>Louvre Museum</SearchResultTitle>
        <SearchResultSubtitle>Paris, France</SearchResultSubtitle>
      </SearchResultBody>
    </SearchResultRow>
  </SearchResults>
);

const meta = {
  title: "Search",
  ...componentStoryMeta(
    "Toolbar search field and result list primitives.",
    "Compose with `Popover`: anchor the field with `SearchToolbarAnchor`, show results in `SearchPopoverContent`.",
  ),
  component: SearchToolbarField,
} satisfies Meta<typeof SearchToolbarField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ToolbarField: Story = {
  parameters: storyDocs(
    "Toolbar slot: input in `SearchToolbarAnchor`, results in `SearchPopoverContent`.",
  ),
  render: () => (
    <SearchPopover defaultOpen modal={false}>
      <SearchToolbarAnchor>
        <SearchToolbarField focused>
          <SearchIcon>
            <SearchGlyph aria-hidden />
          </SearchIcon>
          <SearchInput placeholder="Search…" aria-label="Search" />
          <SearchToolbarShortcutHint keys={["⌘", "K"]} />
        </SearchToolbarField>
      </SearchToolbarAnchor>
      <SearchPopoverContent>
        <SearchEmptyHint>
          Type to search maps, pins, and places.
        </SearchEmptyHint>
        {sampleResults}
      </SearchPopoverContent>
    </SearchPopover>
  ),
};

export const ResultStates: Story = {
  parameters: storyDocs(
    "Focus (keyboard/hover highlight) vs selected (confirmed pick) row styles.",
  ),
  render: () => (
    <SearchResults>
      <SearchResultRow onClick={() => undefined}>
        <SearchResultBody>
          <SearchResultTitle>Default row</SearchResultTitle>
          <SearchResultSubtitle>No highlight</SearchResultSubtitle>
        </SearchResultBody>
      </SearchResultRow>
      <SearchResultRow active onClick={() => undefined}>
        <SearchResultBody>
          <SearchResultTitle>Focused row</SearchResultTitle>
          <SearchResultSubtitle>
            Keyboard or pointer highlight
          </SearchResultSubtitle>
        </SearchResultBody>
      </SearchResultRow>
      <SearchResultRow selected onClick={() => undefined}>
        <SearchResultBody>
          <SearchResultTitle>Selected row</SearchResultTitle>
          <SearchResultSubtitle>Confirmed pick</SearchResultSubtitle>
        </SearchResultBody>
      </SearchResultRow>
      <SearchResultRow active selected onClick={() => undefined}>
        <SearchResultBody>
          <SearchResultTitle>Focused + selected</SearchResultTitle>
          <SearchResultSubtitle>Both states combined</SearchResultSubtitle>
        </SearchResultBody>
      </SearchResultRow>
    </SearchResults>
  ),
};
