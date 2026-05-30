import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import {
  BlogContent,
  BlogHeader,
  BlogKicker,
  BlogLead,
  BlogPageRoot,
  BlogScroll,
  BlogTitle,
} from "./blog";

const meta = {
  title: "Components/Blog",
  ...componentStoryMeta(
    `Layout helpers for the journal blog timeline and entries.`,
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
            <BlogKicker>Journal blog</BlogKicker>
            <BlogTitle>Summer 2025</BlogTitle>
            <BlogLead>Stories from the road, sorted by date.</BlogLead>
          </BlogHeader>
          <p style={{ margin: 0 }}>Post list would appear here.</p>
        </BlogContent>
      </BlogScroll>
    </BlogPageRoot>
  ),
};
