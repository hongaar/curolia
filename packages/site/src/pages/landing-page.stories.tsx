import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";

import { componentStoryMeta, storyDocs } from "../storybook/docs";
import {
  EventsLandingPage,
  FamiliesLandingPage,
  FoodLandingPage,
  GeocachingLandingPage,
  HeritageLandingPage,
  TravelLandingPage,
} from "./campaign-pages";
import {
  ContactPageContent,
  LandingPage,
  PrivacyPolicyPageContent,
  TermsPageContent,
} from "./landing-page";
import { OpenSourceLicensesPageContent } from "./licenses-page";
import { NativeAppLandingPage } from "./native-app-landing-page";
import { OpenSourceMindsetPageContent } from "./open-source-page";
import { PluginsOverviewPageContent } from "./plugins-overview-page";

const meta = {
  title: "Site",
  ...componentStoryMeta(
    "Marketing homepage, campaign landings, and public legal pages for signed-out sessions.",
    "Mounted at `/`, `/for/*`, `/contact`, `/privacy`, `/terms`, `/open-source`, `/plugins-overview`, and `/licenses` from apps/web via `@curolia/site/pages`. Preview uses fullscreen layout and the same display font as apps/web.",
  ),
  component: LandingPage,
  parameters: {
    layout: "fullscreen",
  },
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
    "Generic marketing landing with audiences, plugins, and sharing options.",
  ),
};

export const NativeApp: Story = {
  parameters: storyDocs(
    "Full-viewport welcome shown to signed-out users in the Capacitor shell.",
  ),
  render: () => <NativeAppLandingPage />,
};

export const CampaignTravel: Story = {
  parameters: storyDocs(
    "SEO/campaign landing for travel bloggers at `/for/travel`.",
  ),
  render: () => <TravelLandingPage />,
};

export const CampaignFood: Story = {
  parameters: storyDocs("Campaign landing for food bloggers at `/for/food`."),
  render: () => <FoodLandingPage />,
};

export const CampaignGeocaching: Story = {
  parameters: storyDocs("Campaign landing for geocaching groups."),
  render: () => <GeocachingLandingPage />,
};

export const CampaignFamilies: Story = {
  parameters: storyDocs("Campaign landing for parents and caregivers."),
  render: () => <FamiliesLandingPage />,
};

export const CampaignHeritage: Story = {
  parameters: storyDocs("Campaign landing for local history walks."),
  render: () => <HeritageLandingPage />,
};

export const CampaignEvents: Story = {
  parameters: storyDocs("Campaign landing for festivals and meetups."),
  render: () => <EventsLandingPage />,
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

export const OpenSource: Story = {
  parameters: storyDocs(
    "Open source philosophy and third-party choices at `/open-source`.",
  ),
  render: () => <OpenSourceMindsetPageContent />,
};

export const Plugins: Story = {
  parameters: storyDocs(
    "Public plugin overview at `/plugins-overview` (linked as Plugins in the footer).",
  ),
  render: () => <PluginsOverviewPageContent />,
};

export const Licenses: Story = {
  parameters: storyDocs(
    "Open source summary at `/licenses`; full npm list is injected by the web app.",
  ),
  render: () => <OpenSourceLicensesPageContent />,
};
