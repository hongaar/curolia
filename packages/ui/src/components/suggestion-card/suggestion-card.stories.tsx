import type { Meta, StoryObj } from "@storybook/react";
import { ExternalLink, MapPin } from "lucide-react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Button } from "../button";
import { SuggestionCard, SuggestionCardList } from "./suggestion-card";

const meta = {
  title: "Suggestion Card",
  ...componentStoryMeta(
    `Accent-styled card for surfacing a plugin background suggestion in pin
     details (e.g. "attach this nearby place / article").`,
    `Render \`SuggestionCard\` with an \`icon\`, \`eyebrow\`, \`title\`, optional
     \`description\`/\`meta\`/\`thumbnailUrl\`, action buttons via \`actions\`, and
     an optional \`onDismiss\` handler. Stack several with \`SuggestionCardList\`.`,
  ),
  component: SuggestionCard,
  args: {
    icon: <MapPin aria-hidden />,
    eyebrow: "Suggested · Points of interest",
    title: "Café de Klos",
    meta: "Restaurant · 18 m away",
  },
} satisfies Meta<typeof SuggestionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs(
    "Compact suggestion with an attach action and a dismiss button.",
  ),
  render: (args) => (
    <StoryFrame width="sm">
      <SuggestionCard
        {...args}
        onDismiss={() => {}}
        actions={
          <Button type="button" size="sm">
            Attach place
          </Button>
        }
      />
    </StoryFrame>
  ),
};

export const WithThumbnailAndDescription: Story = {
  parameters: storyDocs(
    "Richer suggestion with a thumbnail, extract, and two actions.",
  ),
  args: {
    eyebrow: "Suggested · Wikipedia",
    title: "Rijksmuseum",
    meta: "120 m away",
    description:
      "The Rijksmuseum is a Dutch national museum dedicated to arts and history in Amsterdam, founded in 1798.",
    thumbnailUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Rijksmuseum_Amsterdam.jpg/240px-Rijksmuseum_Amsterdam.jpg",
  },
  render: (args) => (
    <StoryFrame width="sm">
      <SuggestionCard
        {...args}
        onDismiss={() => {}}
        actions={
          <>
            <Button type="button" size="sm">
              Attach article
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              render={
                <a
                  href="https://en.wikipedia.org/wiki/Rijksmuseum"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <ExternalLink aria-hidden /> Read more
            </Button>
          </>
        }
      />
    </StoryFrame>
  ),
};

export const Busy: Story = {
  parameters: storyDocs("Working state while the attach action runs."),
  render: (args) => (
    <StoryFrame width="sm">
      <SuggestionCard
        {...args}
        busy
        onDismiss={() => {}}
        actions={
          <Button type="button" size="sm" disabled>
            Attaching…
          </Button>
        }
      />
    </StoryFrame>
  ),
};

export const Stacked: Story = {
  parameters: storyDocs(
    "Multiple suggestions stacked with SuggestionCardList.",
  ),
  render: () => (
    <StoryFrame width="sm">
      <SuggestionCardList>
        <SuggestionCard
          icon={<MapPin aria-hidden />}
          eyebrow="Suggested · Points of interest"
          title="Café de Klos"
          meta="Restaurant · 18 m away"
          onDismiss={() => {}}
          actions={
            <Button type="button" size="sm">
              Attach place
            </Button>
          }
        />
        <SuggestionCard
          eyebrow="Suggested · Wikipedia"
          title="Anne Frank House"
          meta="95 m away"
          description="A biographical museum dedicated to the Jewish wartime diarist Anne Frank."
          onDismiss={() => {}}
          actions={
            <Button type="button" size="sm">
              Attach article
            </Button>
          }
        />
      </SuggestionCardList>
    </StoryFrame>
  ),
};
