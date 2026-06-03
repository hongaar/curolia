import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { SearchCombobox, type SearchComboboxGroup } from "./search-combobox";

const meta = {
  title: "Search Combobox",
  ...componentStoryMeta(
    "Select-like search field: text input trigger with grouped results in a popover.",
    "Use for async search (e.g. Spotify library + catalog).",
  ),
  component: SearchCombobox,
} satisfies Meta;

export default meta;
type Story = StoryObj;

type DemoItem = { id: string; title: string; meta: string };

export const Default: Story = {
  parameters: storyDocs("Grouped search results in a popover panel."),
  render: function Render() {
    const [query, setQuery] = useState("");
    const groups: SearchComboboxGroup<DemoItem>[] = [
      {
        id: "library",
        label: "Your library",
        items:
          query.length >= 2
            ? [
                {
                  id: "1",
                  title: "Road trip mix",
                  meta: "Your playlist · 42 tracks",
                },
              ]
            : [],
      },
      {
        id: "catalog",
        label: "Spotify",
        items:
          query.length >= 2
            ? [{ id: "2", title: "Example track", meta: "Track · Artist" }]
            : [],
      },
    ];
    return (
      <StoryFrame width="md">
        <SearchCombobox
          query={query}
          onQueryChange={setQuery}
          placeholder="Search…"
          groups={groups}
          getItemKey={(item) => item.id}
          onSelect={() => undefined}
          renderItem={(item) => ({
            title: item.title,
            meta: item.meta,
          })}
        />
      </StoryFrame>
    );
  },
};
