import type { Meta, StoryObj } from "@storybook/react";
import { Coffee } from "lucide-react";
import { useState } from "react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import {
  ExplorePanel,
  ExplorePanelBody,
  ExplorePanelEntryButton,
  ExplorePanelEntryList,
  ExplorePanelFilterChip,
  ExplorePanelFilterGroup,
  ExplorePanelFilterLabel,
  ExplorePanelFilterRow,
  ExplorePanelHeader,
  ExplorePanelHeaderIcon,
  ExplorePanelHeaderTitle,
  ExplorePanelPlaceholder,
} from "./explore-panel";

const meta = {
  title: "Explore Panel",
  ...componentStoryMeta(
    "Collapsible explore card for category filters and result lists on the map.",
    "Use `ExplorePanel` collapsed until a category is active; expand with filters and entries inside `ExplorePanelBody`.",
  ),
  component: ExplorePanel,
} satisfies Meta<typeof ExplorePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {
  parameters: storyDocs("Placeholder state before a category is selected."),
  render: () => (
    <ExplorePanel expanded={false}>
      <ExplorePanelPlaceholder>
        Select a category to explore nearby places.
      </ExplorePanelPlaceholder>
    </ExplorePanel>
  ),
};

export const Expanded: Story = {
  parameters: storyDocs("Expanded card with filter chips and entry rows."),
  render: function Render() {
    const [price, setPrice] = useState("mid");
    const [features, setFeatures] = useState<string[]>(["wifi"]);

    const toggleFeature = (id: string) => {
      setFeatures((current) =>
        current.includes(id)
          ? current.filter((value) => value !== id)
          : [...current, id],
      );
    };

    return (
      <ExplorePanel expanded>
        <ExplorePanelHeader>
          <ExplorePanelHeaderIcon>
            <Coffee aria-hidden />
          </ExplorePanelHeaderIcon>
          <ExplorePanelHeaderTitle>Coffee</ExplorePanelHeaderTitle>
        </ExplorePanelHeader>
        <ExplorePanelBody>
          <ExplorePanelFilterGroup>
            <ExplorePanelFilterLabel id="price-label">
              Price
            </ExplorePanelFilterLabel>
            <ExplorePanelFilterRow labelledBy="price-label">
              {[
                { id: "budget", label: "Budget" },
                { id: "mid", label: "Mid-range" },
                { id: "premium", label: "Premium" },
              ].map((option) => (
                <ExplorePanelFilterChip
                  key={option.id}
                  label={option.label}
                  active={price === option.id}
                  onClick={() => setPrice(option.id)}
                />
              ))}
            </ExplorePanelFilterRow>
          </ExplorePanelFilterGroup>
          <ExplorePanelFilterGroup>
            <ExplorePanelFilterLabel id="features-label">
              Features
            </ExplorePanelFilterLabel>
            <ExplorePanelFilterRow labelledBy="features-label">
              {[
                { id: "wifi", label: "Wi‑Fi" },
                { id: "outdoor", label: "Outdoor seating" },
              ].map((option) => (
                <ExplorePanelFilterChip
                  key={option.id}
                  label={option.label}
                  active={features.includes(option.id)}
                  onClick={() => toggleFeature(option.id)}
                />
              ))}
            </ExplorePanelFilterRow>
          </ExplorePanelFilterGroup>
          <ExplorePanelEntryList>
            <ExplorePanelEntryButton
              title="Roast House"
              subtitle="Single-origin pour-overs"
              meta="0.4 km"
            />
            <ExplorePanelEntryButton
              title="Corner Café"
              subtitle="Quick espresso bar"
              meta="0.6 km"
            />
          </ExplorePanelEntryList>
        </ExplorePanelBody>
      </ExplorePanel>
    );
  },
};

export const EmptyResults: Story = {
  parameters: storyDocs("Empty list copy when filters exclude all entries."),
  render: () => (
    <ExplorePanel expanded>
      <ExplorePanelHeader>
        <ExplorePanelHeaderIcon>
          <Coffee aria-hidden />
        </ExplorePanelHeaderIcon>
        <ExplorePanelHeaderTitle>Coffee</ExplorePanelHeaderTitle>
      </ExplorePanelHeader>
      <ExplorePanelBody>
        <ExplorePanelEntryList />
      </ExplorePanelBody>
    </ExplorePanel>
  ),
};
