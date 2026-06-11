import type { Meta, StoryObj } from "@storybook/react";
import {
  Building2,
  FileText,
  Loader2,
  Map as MapIcon,
  MapPin,
  Search as SearchGlyph,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  componentStoryMeta,
  storyArgTypes,
  storyDocs,
} from "../../storybook/docs";
import { StoryColumn, StoryFrame, StoryRow } from "../../storybook/story-frame";
import { Button } from "../button";
import { MapMarker } from "../map-marker";
import { PageBackButton } from "../page-back-button";
import { Popover as SearchPopover } from "../popover";
import {
  SearchActivePanel,
  SearchActivePanelActions,
  SearchActivePanelBody,
  SearchActivePanelDetail,
  SearchActivePanelDetails,
  SearchActivePanelHeader,
  SearchActivePanelIcon,
  SearchActivePanelNav,
  SearchActivePanelSubtitle,
  SearchActivePanelTitle,
  SearchActivePanelTitleRow,
  SearchEmptyHint,
  SearchIcon,
  SearchInput,
  SearchPopoverContent,
  SearchPopoverTitle,
  SearchResultBody,
  SearchResultCategory,
  SearchResultEnd,
  SearchResultIcon,
  SearchResultRow,
  SearchResults,
  SearchResultShortcut,
  SearchResultSubtitle,
  SearchResultTitle,
  SearchResultTitleRow,
  SearchResultTrailing,
  SearchSectionLabel,
  SearchShortcutKeys,
  SearchSpinner,
  SearchStatusText,
  SearchToolbarActions,
  SearchToolbarAnchor,
  SearchToolbarField,
  SearchToolbarShortcutHint,
} from "./search";

const noop = () => undefined;

function SampleResultRow({
  title,
  subtitle,
  categoryLabel,
  icon,
  trailing,
  shortcutKeys,
  active = false,
  selected = false,
}: {
  title: string;
  subtitle?: string;
  categoryLabel?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  shortcutKeys?: string[];
  active?: boolean;
  selected?: boolean;
}) {
  const end =
    trailing || shortcutKeys ? (
      <SearchResultEnd>
        {trailing ? (
          <SearchResultTrailing>{trailing}</SearchResultTrailing>
        ) : null}
        {shortcutKeys ? <SearchResultShortcut keys={shortcutKeys} /> : null}
      </SearchResultEnd>
    ) : null;

  return (
    <SearchResultRow active={active} selected={selected} onClick={noop}>
      {icon ? <SearchResultIcon>{icon}</SearchResultIcon> : null}
      <SearchResultBody>
        <SearchResultTitleRow>
          <SearchResultTitle>{title}</SearchResultTitle>
          {categoryLabel ? (
            <SearchResultCategory>{categoryLabel}</SearchResultCategory>
          ) : null}
        </SearchResultTitleRow>
        {subtitle ? (
          <SearchResultSubtitle>{subtitle}</SearchResultSubtitle>
        ) : null}
      </SearchResultBody>
      {end}
    </SearchResultRow>
  );
}

const meta = {
  title: "Search",
  ...componentStoryMeta(
    "Toolbar search field chrome, popover results panel, and result row primitives.",
    "Compose with `Popover` (`modal={false}`): `SearchToolbarAnchor` + `SearchToolbarField` for the input row, `SearchPopoverContent` for results. Icons and command shortcuts are app-supplied children/slots — the ui package only provides layout and styling. Row `active` is for keyboard/pointer highlight; `selected` is for a confirmed pick still shown in the list.",
    {
      argTypes: storyArgTypes({
        focused:
          "Orange focus ring on the toolbar field (set while the input is focused).",
        active:
          "Keyboard or pointer highlight on a result row (`useSearchListKeyboard`).",
        selected:
          "Confirmed selection typography on a result row (optional; app may persist selection in the toolbar instead).",
        embedded:
          "When true, `SearchResults` does not scroll inside the panel — parent sets bounds.",
      }),
    },
  ),
  component: SearchToolbarField,
  args: {
    focused: false,
  },
} satisfies Meta<typeof SearchToolbarField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ToolbarField: Story = {
  parameters: storyDocs(
    "Toolbar input row. Toggle `focused` for the active field ring.",
  ),
  render: function Render(args) {
    return (
      <StoryFrame width="lg">
        <SearchToolbarField {...args}>
          <SearchIcon>
            <SearchGlyph aria-hidden />
          </SearchIcon>
          <SearchInput placeholder="Search, actions…" aria-label="Search" />
        </SearchToolbarField>
      </StoryFrame>
    );
  },
};

export const ToolbarFieldFocused: Story = {
  parameters: storyDocs("Focused toolbar field (as when the input is active)."),
  args: { focused: true },
  render: function Render(args) {
    return (
      <StoryFrame width="lg">
        <SearchToolbarField {...args}>
          <SearchIcon>
            <SearchGlyph aria-hidden />
          </SearchIcon>
          <SearchInput placeholder="Search, actions…" aria-label="Search" />
        </SearchToolbarField>
      </StoryFrame>
    );
  },
};

export const ToolbarTrailingShortcut: Story = {
  parameters: storyDocs(
    "`SearchToolbarShortcutHint` — keyboard hint slot when the field is empty.",
  ),
  render: () => (
    <StoryFrame width="lg">
      <SearchToolbarField>
        <SearchIcon>
          <SearchGlyph aria-hidden />
        </SearchIcon>
        <SearchInput placeholder="Search, actions…" aria-label="Search" />
        <SearchToolbarShortcutHint keys={["⌘", "K"]} />
      </SearchToolbarField>
    </StoryFrame>
  ),
};

export const ToolbarTrailingSpinner: Story = {
  parameters: storyDocs(
    "`SearchSpinner` — loading affordance while async results fetch.",
  ),
  render: () => (
    <StoryFrame width="lg">
      <SearchToolbarField focused>
        <SearchIcon>
          <SearchGlyph aria-hidden />
        </SearchIcon>
        <SearchInput
          defaultValue="paris"
          placeholder="Search, actions…"
          aria-label="Search"
        />
        <SearchSpinner>
          <Loader2 aria-hidden />
        </SearchSpinner>
      </SearchToolbarField>
    </StoryFrame>
  ),
};

export const ToolbarTrailingActions: Story = {
  parameters: storyDocs(
    "`SearchToolbarActions` — trailing buttons (e.g. Add pin + Clear after picking a place).",
  ),
  render: () => (
    <StoryFrame width="lg">
      <SearchToolbarField focused>
        <SearchIcon>
          <SearchGlyph aria-hidden />
        </SearchIcon>
        <SearchInput defaultValue="Zoetermeer" aria-label="Search" readOnly />
        <SearchToolbarActions>
          <Button type="button" variant="outline" size="sm" onClick={noop}>
            Add pin
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Clear search"
            onClick={noop}
          >
            <X aria-hidden />
          </Button>
        </SearchToolbarActions>
      </SearchToolbarField>
    </StoryFrame>
  ),
};

export const ShortcutKeys: Story = {
  parameters: storyDocs(
    "`SearchShortcutKeys` — `toolbar` variant (in-field hint) vs `result` variant (row trailing).",
  ),
  render: () => (
    <StoryColumn>
      <StoryRow>
        <span>Toolbar</span>
        <SearchShortcutKeys keys={["⌘", "K"]} variant="toolbar" />
      </StoryRow>
      <StoryRow>
        <span>Result row</span>
        <SearchShortcutKeys keys={["⌘", ","]} variant="result" />
      </StoryRow>
    </StoryColumn>
  ),
};

export const ResultStates: Story = {
  parameters: storyDocs(
    "Result row states: default, `active` (keyboard/pointer), `selected` (confirmed pick), and both.",
  ),
  render: () => (
    <StoryFrame width="lg">
      <SearchResults>
        <SampleResultRow title="Default row" subtitle="No highlight" />
        <SampleResultRow
          title="Active row"
          subtitle="Keyboard or pointer highlight"
          active
        />
        <SampleResultRow
          title="Selected row"
          subtitle="Confirmed pick still in the list"
          selected
        />
        <SampleResultRow
          title="Active + selected"
          subtitle="Focused while selected"
          active
          selected
        />
      </SearchResults>
    </StoryFrame>
  ),
};

export const FullResultRow: Story = {
  parameters: storyDocs(
    "Action rows keep a leading icon + shortcut. Place and pin rows use a trailing preview on the right.",
  ),
  render: () => (
    <StoryFrame width="lg">
      <SearchResults>
        <SearchSectionLabel>Actions</SearchSectionLabel>
        <SampleResultRow
          icon={<FileText aria-hidden />}
          title="Settings"
          subtitle="Preferences and account"
          shortcutKeys={["⌘", ","]}
        />
        <SearchSectionLabel>Places</SearchSectionLabel>
        <SampleResultRow
          title="Zoetermeer"
          subtitle="South Holland, Netherlands"
          categoryLabel="City"
          trailing={<Building2 aria-hidden />}
          active
        />
        <SearchSectionLabel>Pins</SearchSectionLabel>
        <SampleResultRow
          title="Café de Flore"
          subtitle="My Paris trip"
          trailing={<MapMarker size="sm" emoji="☕" fill="#c2410c" />}
        />
      </SearchResults>
    </StoryFrame>
  ),
};

export const ActivePlacePanel: Story = {
  parameters: storyDocs(
    "Shown instead of results when a place is active — back nav, title, detail, and actions.",
  ),
  render: () => (
    <StoryFrame width="lg">
      <SearchPopover defaultOpen modal={false}>
        <SearchToolbarAnchor>
          <SearchToolbarField focused>
            <SearchIcon>
              <SearchGlyph aria-hidden />
            </SearchIcon>
            <SearchInput
              defaultValue="Zoetermeer"
              aria-label="Search"
              readOnly
            />
            <SearchToolbarActions>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Clear search"
              >
                <X aria-hidden />
              </Button>
            </SearchToolbarActions>
          </SearchToolbarField>
        </SearchToolbarAnchor>
        <SearchPopoverContent>
          <SearchActivePanel>
            <SearchActivePanelNav>
              <PageBackButton label="Back" onClick={noop} />
            </SearchActivePanelNav>
            <SearchActivePanelHeader>
              <SearchActivePanelTitleRow>
                <SearchActivePanelTitle>Zoetermeer</SearchActivePanelTitle>
                <SearchResultCategory>City</SearchResultCategory>
              </SearchActivePanelTitleRow>
              <SearchActivePanelIcon>
                <Building2 aria-hidden />
              </SearchActivePanelIcon>
            </SearchActivePanelHeader>
            <SearchActivePanelBody>
              <SearchActivePanelSubtitle>
                South Holland, Netherlands
              </SearchActivePanelSubtitle>
              <SearchActivePanelDetails>
                <SearchActivePanelDetail label="Region">
                  South Holland
                </SearchActivePanelDetail>
                <SearchActivePanelDetail label="Country">
                  Netherlands
                </SearchActivePanelDetail>
                <SearchActivePanelDetail label="Coordinates">
                  52.05750° N, 4.49310° E
                </SearchActivePanelDetail>
              </SearchActivePanelDetails>
            </SearchActivePanelBody>
            <SearchActivePanelActions>
              <Button type="button" variant="default" size="sm">
                Add pin
              </Button>
            </SearchActivePanelActions>
          </SearchActivePanel>
        </SearchPopoverContent>
      </SearchPopover>
    </StoryFrame>
  ),
};

export const TrailingSlot: Story = {
  parameters: storyDocs(
    "`SearchResultEnd` + `SearchResultTrailing` — right-aligned marker preview or type icon.",
  ),
  render: () => (
    <StoryFrame width="lg">
      <SearchResults>
        <SampleResultRow
          title="Pin with tag color"
          subtitle="Trailing map marker"
          trailing={<MapMarker size="sm" emoji="🍕" fill="#16a34a" />}
        />
        <SampleResultRow
          title="Landmark"
          subtitle="Paris, France"
          categoryLabel="Museum"
          trailing={<MapIcon aria-hidden />}
        />
      </SearchResults>
    </StoryFrame>
  ),
};

export const PanelContent: Story = {
  parameters: storyDocs(
    "`SearchEmptyHint`, `SearchSectionLabel`, and `SearchStatusText` inside the results panel.",
  ),
  render: () => (
    <StoryFrame width="lg">
      <SearchPopoverContent>
        <SearchResults>
          <SearchEmptyHint>
            Jump to actions and pages, or type two or more characters to search
            pins and places.
          </SearchEmptyHint>
          <SearchSectionLabel>Maps</SearchSectionLabel>
          <SearchStatusText>
            No maps match. Add another letter to search pins.
          </SearchStatusText>
          <SearchSectionLabel>Pins</SearchSectionLabel>
          <SearchStatusText>Searching…</SearchStatusText>
        </SearchResults>
      </SearchPopoverContent>
    </StoryFrame>
  ),
};

export const ResultsEmbedded: Story = {
  parameters: storyDocs(
    "`SearchResults` with `embedded` — no internal max-height scroll; parent controls bounds.",
  ),
  render: () => (
    <StoryFrame width="lg">
      <div
        style={{
          maxHeight: 120,
          overflow: "auto",
          border: "1px solid var(--border)",
        }}
      >
        <SearchResults embedded>
          {Array.from({ length: 8 }, (_, i) => (
            <SampleResultRow
              key={i}
              title={`Result ${i + 1}`}
              subtitle="Embedded scroll container"
            />
          ))}
        </SearchResults>
      </div>
    </StoryFrame>
  ),
};

export const ToolbarWithPopover: Story = {
  parameters: storyDocs(
    "Full composition: toolbar anchor + field + popover results (production layout).",
  ),
  render: () => (
    <StoryFrame width="lg">
      <SearchPopover defaultOpen modal={false}>
        <SearchToolbarAnchor>
          <SearchToolbarField focused>
            <SearchIcon>
              <SearchGlyph aria-hidden />
            </SearchIcon>
            <SearchInput placeholder="Search, actions…" aria-label="Search" />
            <SearchToolbarShortcutHint keys={["⌘", "K"]} />
          </SearchToolbarField>
        </SearchToolbarAnchor>
        <SearchPopoverContent>
          <SearchPopoverTitle>
            Search maps, actions, and pages
          </SearchPopoverTitle>
          <SearchResults>
            <SearchEmptyHint>
              Type to search maps, pins, and places.
            </SearchEmptyHint>
            <SearchSectionLabel>Places</SearchSectionLabel>
            <SampleResultRow
              title="Café de Flore"
              subtitle="Paris, France"
              categoryLabel="Café"
              trailing={<MapPin aria-hidden />}
            />
            <SampleResultRow
              title="Louvre Museum"
              subtitle="Paris, France"
              categoryLabel="Museum"
              trailing={<Building2 aria-hidden />}
            />
          </SearchResults>
        </SearchPopoverContent>
      </SearchPopover>
    </StoryFrame>
  ),
};
