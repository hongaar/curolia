import type { Meta, StoryObj } from "@storybook/react";
import {
  Bike,
  Coffee,
  Footprints,
  Fuel,
  Hotel,
  ShoppingBag,
  TreePine,
  Utensils,
} from "lucide-react";
import { useState } from "react";
import { useStoryArgs } from "../../storybook/args";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import {
  CategoryChip,
  CategoryChipCollapse,
  CategoryChipGrid,
  CategoryChipMore,
  CategoryChipPanel,
  CategoryChipPanelBody,
  CategoryChipRow,
} from "./category-chips";

const poiCategories = [
  { id: "coffee", label: "Coffee", icon: <Coffee aria-hidden /> },
  { id: "restaurants", label: "Restaurants", icon: <Utensils aria-hidden /> },
  { id: "hotels", label: "Hotels", icon: <Hotel aria-hidden /> },
  { id: "shops", label: "Shops", icon: <ShoppingBag aria-hidden /> },
  { id: "parks", label: "Parks", icon: <TreePine aria-hidden /> },
  { id: "fuel", label: "Fuel", icon: <Fuel aria-hidden /> },
] as const;

const routeCategories = [
  { id: "hiking", label: "Hiking", icon: <Footprints aria-hidden /> },
  { id: "cycling", label: "Cycling", icon: <Bike aria-hidden /> },
] as const;

const meta = {
  title: "Category Chips",
  ...componentStoryMeta(
    "Category chips for map explore filters — collapsed teaser row and expanded multi-row panel.",
    "Use `CategoryChipRow` when collapsed; `CategoryChipPanel` with `CategoryChipGrid` when expanded.",
  ),
  component: CategoryChipRow,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Selectable category chips in a horizontal row."),
  render: function Render() {
    const [{ activeId }, updateArgs] = useStoryArgs<{
      activeId: string | null;
    }>({ activeId: "coffee" });

    return (
      <CategoryChipRow>
        {poiCategories.map((category) => (
          <CategoryChip
            key={category.id}
            icon={category.icon}
            label={category.label}
            active={activeId === category.id}
            onClick={() =>
              updateArgs({
                activeId: activeId === category.id ? null : category.id,
              })
            }
          />
        ))}
      </CategoryChipRow>
    );
  },
};

export const CollapsedTeaser: Story = {
  parameters: storyDocs(
    "Collapsed explore row: one teaser chip and a more control.",
  ),
  render: function Render() {
    const [{ activeId }, updateArgs] = useStoryArgs<{
      activeId: string | null;
    }>({ activeId: null });

    const teaser = poiCategories[0];

    return (
      <CategoryChipRow>
        <CategoryChip
          icon={teaser.icon}
          label={teaser.label}
          active={activeId === teaser.id}
          onClick={() =>
            updateArgs({
              activeId: activeId === teaser.id ? null : teaser.id,
            })
          }
        />
        <CategoryChipMore onClick={() => undefined} />
      </CategoryChipRow>
    );
  },
};

export const ExpandedPanel: Story = {
  parameters: storyDocs(
    "Expanded explore panel: collapse control and wrapping chips (route variants use a distinct fill).",
  ),
  render: function Render() {
    const [activeIds, setActiveIds] = useState<string[]>(["coffee"]);

    const toggle = (id: string) => {
      setActiveIds((current) =>
        current.includes(id)
          ? current.filter((item) => item !== id)
          : [...current, id],
      );
    };

    const allCategories = [...poiCategories, ...routeCategories];

    return (
      <CategoryChipPanel>
        <CategoryChipCollapse onClick={() => undefined} />
        <CategoryChipPanelBody>
          <CategoryChipGrid>
            {allCategories.map((category) => (
              <CategoryChip
                key={category.id}
                variant={
                  category.id === "hiking" || category.id === "cycling"
                    ? "route"
                    : "poi"
                }
                icon={category.icon}
                label={category.label}
                active={activeIds.includes(category.id)}
                onClick={() => toggle(category.id)}
              />
            ))}
          </CategoryChipGrid>
        </CategoryChipPanelBody>
      </CategoryChipPanel>
    );
  },
};

export const NoneSelected: Story = {
  parameters: storyDocs("Chips with no active selection."),
  render: function Render() {
    const [activeId, setActiveId] = useState<string | null>(null);

    return (
      <CategoryChipRow>
        {poiCategories.map((category) => (
          <CategoryChip
            key={category.id}
            icon={category.icon}
            label={category.label}
            active={activeId === category.id}
            onClick={() =>
              setActiveId((current) =>
                current === category.id ? null : category.id,
              )
            }
          />
        ))}
      </CategoryChipRow>
    );
  },
};
