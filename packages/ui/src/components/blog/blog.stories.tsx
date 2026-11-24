import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { useStoryArgs } from "../../storybook/args";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import {
  BlogAuthorCard,
  BlogContent,
  BlogHeader,
  BlogLead,
  BlogPageRoot,
  BlogPinTitle,
  BlogPinTitleButton,
  BlogScroll,
  BlogScrollToolbarRow,
  BlogTitle,
} from "./blog";

const meta = {
  title: "Blog",
  ...componentStoryMeta(
    `Layout helpers for the map blog timeline and entries.`,
    `Compose blog list rows and metadata from exported primitives in \`blog.tsx\`.`,
  ),
  component: BlogPageRoot,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Blog page shell with header and scrollable content."),
  render: () => (
    <BlogPageRoot>
      <BlogScroll>
        <BlogContent>
          <BlogHeader>
            <BlogTitle>Summer 2025</BlogTitle>
            <BlogAuthorCard
              avatar={
                <span
                  aria-hidden
                  style={{
                    display: "inline-flex",
                    width: "2rem",
                    height: "2rem",
                    borderRadius: "9999px",
                    background: "var(--muted)",
                  }}
                />
              }
              name="Alex Rivera"
              bio="Travel writer mapping favorite cafés and coastal trails."
            />
            <BlogLead>Stories from the road, sorted by date.</BlogLead>
          </BlogHeader>
          <p style={{ margin: 0 }}>Post list would appear here.</p>
        </BlogContent>
      </BlogScroll>
    </BlogPageRoot>
  ),
};

export const PinTitleAccent: Story = {
  parameters: storyDocs(
    "Pin titles take the tag color on hover (with underline); `active` keeps it without underline. Pale/dark colors are clamped for contrast.",
  ),
  render: () => (
    <BlogContent>
      <BlogPinTitle>
        <BlogPinTitleButton accentColor="#2d6a5d">
          Default tag (hover me)
        </BlogPinTitleButton>
      </BlogPinTitle>
      <BlogPinTitle spaced>
        <BlogPinTitleButton accentColor="#ffe66d">
          Very light tag (hover me)
        </BlogPinTitleButton>
      </BlogPinTitle>
      <BlogPinTitle spaced>
        <BlogPinTitleButton accentColor="#ff851b" active>
          Active pin
        </BlogPinTitleButton>
      </BlogPinTitle>
    </BlogContent>
  ),
};

export const FloatingAuthorCardSlide: Story = {
  parameters: storyDocs(
    "Floating author card (map overlay). `hidden` slides it out to the left and back in; toggle the button to preview.",
  ),
  render: function Render() {
    const [{ authorHidden }, updateArgs] = useStoryArgs<{
      authorHidden?: boolean;
    }>();
    return (
      <div style={{ display: "grid", gap: "1rem", justifyItems: "start" }}>
        <button
          type="button"
          onClick={() => updateArgs({ authorHidden: !authorHidden })}
        >
          {authorHidden ? "Show" : "Hide"} author
        </button>
        <BlogAuthorCard
          surface="floating"
          hidden={authorHidden}
          avatar={
            <span
              aria-hidden
              style={{
                display: "inline-flex",
                width: "2rem",
                height: "2rem",
                borderRadius: "9999px",
                background: "var(--muted)",
              }}
            />
          }
          name="Ada Lovelace"
        />
      </div>
    );
  },
};

export const ScrollToolbarRow: Story = {
  parameters: {
    ...storyDocs(
      "Small viewport: a toolbar row (e.g. map picker) pulled up beside the fixed brand that scrolls away with the content. Hidden from 40rem.",
    ),
    viewport: { defaultViewport: "mobile1" },
  },
  render: () => (
    <BlogPageRoot>
      <BlogScroll>
        <BlogScrollToolbarRow>
          <span>🗺️ Summer 2025 ▾</span>
        </BlogScrollToolbarRow>
        <BlogContent>
          <BlogHeader>
            <BlogTitle>Summer 2025</BlogTitle>
          </BlogHeader>
        </BlogContent>
      </BlogScroll>
    </BlogPageRoot>
  ),
};
