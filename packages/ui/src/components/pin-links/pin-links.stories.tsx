import type { Meta, StoryObj } from "@storybook/react";
import { Globe } from "lucide-react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import {
  PinLinkRowBody,
  PinLinkRowDomain,
  PinLinkRowLink,
  PinLinkRowTitle,
  PinLinksListRoot,
} from "./pin-links";

const meta = {
  title: "Pin Links",
  ...componentStoryMeta(
    `Link list and editor styling on pin forms.`,
    `Use for URL rows with favicon, label, and remove actions.`,
  ),
  component: PinLinksListRoot,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Read-only link rows with favicon and metadata."),
  render: () => (
    <StoryFrame width="md">
      <PinLinksListRoot>
        <li>
          <PinLinkRowLink href="https://example.com">
            <PinLinkRowBody>
              <Globe className="size-4" aria-hidden />
              <PinLinkRowTitle>example.com</PinLinkRowTitle>
              <PinLinkRowDomain>example.com</PinLinkRowDomain>
            </PinLinkRowBody>
          </PinLinkRowLink>
        </li>
      </PinLinksListRoot>
    </StoryFrame>
  ),
};
