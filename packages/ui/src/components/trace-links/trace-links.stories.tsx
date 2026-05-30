import type { Meta, StoryObj } from "@storybook/react";
import { Globe } from "lucide-react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import {
  TraceLinkRowBody,
  TraceLinkRowDomain,
  TraceLinkRowLink,
  TraceLinkRowTitle,
  TraceLinksListRoot,
} from "./trace-links";

const meta = {
  title: "Components/Trace Links",
  ...componentStoryMeta(
    `Link list and editor styling on trace forms.`,
    `Use for URL rows with favicon, label, and remove actions.`,
  ),
  component: TraceLinksListRoot,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Read-only link rows with favicon and metadata."),
  render: () => (
    <StoryFrame width="md">
      <TraceLinksListRoot>
        <li>
          <TraceLinkRowLink href="https://example.com">
            <TraceLinkRowBody>
              <Globe className="size-4" aria-hidden />
              <TraceLinkRowTitle>example.com</TraceLinkRowTitle>
              <TraceLinkRowDomain>example.com</TraceLinkRowDomain>
            </TraceLinkRowBody>
          </TraceLinkRowLink>
        </li>
      </TraceLinksListRoot>
    </StoryFrame>
  ),
};
