import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import {
  ContactPageContent,
  LandingPage,
  PrivacyPolicyPageContent,
  TermsPageContent,
} from "./landing-page";

const meta = {
  title: "Landing Page",
  ...componentStoryMeta(
    "Marketing homepage and contact layout for signed-out sessions.",
    "Use `LandingPage` at `/`, `ContactPageContent` at `/contact`, and legal pages at `/privacy` and `/terms`. Images live in `apps/web/public/landing/`.",
  ),
  component: LandingPage,
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

export const Home: Story = {
  parameters: storyDocs(
    "Full marketing landing page with hero, features, and CTA.",
  ),
};

export const Contact: Story = {
  parameters: storyDocs(
    "Contact page using the shared marketing header and footer.",
  ),
  render: () => <ContactPageContent />,
};

export const Privacy: Story = {
  parameters: storyDocs("Public privacy policy at `/privacy`."),
  render: () => <PrivacyPolicyPageContent />,
};

export const Terms: Story = {
  parameters: storyDocs("Public terms and conditions at `/terms`."),
  render: () => <TermsPageContent />,
};
