import { campaigns } from "@curolia/site/content";
import {
  ContactPageContent,
  EventsLandingPage,
  FamiliesLandingPage,
  FoodLandingPage,
  GeocachingLandingPage,
  HeritageLandingPage,
  HikingLandingPage,
  LandingPage,
  OpenSourceLicensesPageContent,
  OpenSourceMindsetPageContent,
  PluginsOverviewPageContent,
  PrivacyPolicyPageContent,
  TermsPageContent,
  TravelLandingPage,
  VanlifeLandingPage,
} from "@curolia/site/pages";
import type { ReactElement } from "react";

import type { PageMeta } from "@/ssr/render-document";
import type { StaticSsrRouteId } from "@/ssr/routes";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  homePageJsonLd,
  SITE_NAME,
} from "@/ssr/seo";

const STATIC_META: Record<Exclude<StaticSsrRouteId, "campaign">, PageMeta> = {
  home: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    imageUrl: DEFAULT_OG_IMAGE,
    imageAlt: "Traveler planning their next stop on a map in Curolia",
    jsonLd: homePageJsonLd(),
  },
  contact: {
    title: "Contact — Curolia",
    description:
      "Questions about Curolia, your travel maps, or partnerships? Email the Curolia team.",
  },
  privacy: {
    title: "Privacy Policy — Curolia",
    description:
      "How Curolia collects, uses, and protects your data when you map places and share trips.",
  },
  terms: {
    title: "Terms and Conditions — Curolia",
    description:
      "Terms and conditions for using Curolia's travel atlas and map journal.",
  },
  openSource: {
    title: "Open Source at Curolia",
    description:
      "How Curolia builds in the open and chooses privacy-respecting, open source services.",
  },
  pluginsOverview: {
    title: "Plugins — Curolia",
    description:
      "Connect Curolia maps to photos, music, calendars, points of interest, routes, and more.",
  },
  licenses: {
    title: "Open Source Licenses — Curolia",
    description: "Open source software used by Curolia.",
  },
};

const CAMPAIGN_PAGES: Record<string, () => ReactElement> = {
  travel: () => <TravelLandingPage />,
  food: () => <FoodLandingPage />,
  geocaching: () => <GeocachingLandingPage />,
  families: () => <FamiliesLandingPage />,
  hiking: () => <HikingLandingPage />,
  vanlife: () => <VanlifeLandingPage />,
  heritage: () => <HeritageLandingPage />,
  events: () => <EventsLandingPage />,
};

export function staticPageMeta(
  id: StaticSsrRouteId,
  campaignId?: string,
): PageMeta {
  if (id === "campaign") {
    const campaign = campaigns.find((entry) => entry.id === campaignId);
    if (!campaign) {
      return {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        robots: "noindex",
      };
    }
    return {
      title: `${campaign.title} — ${SITE_NAME}`,
      description: campaign.lead,
      imageUrl: campaign.heroImage.src.replace(/\?w=\d+/, "?w=1200&h=630"),
      imageAlt: campaign.heroImage.alt,
    };
  }
  return STATIC_META[id];
}

export function renderStaticPage(
  id: StaticSsrRouteId,
  campaignId?: string,
): ReactElement | null {
  switch (id) {
    case "home":
      return <LandingPage />;
    case "contact":
      return <ContactPageContent />;
    case "privacy":
      return <PrivacyPolicyPageContent />;
    case "terms":
      return <TermsPageContent />;
    case "openSource":
      return <OpenSourceMindsetPageContent />;
    case "pluginsOverview":
      return <PluginsOverviewPageContent />;
    case "licenses":
      return <OpenSourceLicensesPageContent />;
    case "campaign": {
      const render = campaignId ? CAMPAIGN_PAGES[campaignId] : undefined;
      return render ? render() : null;
    }
    default:
      return null;
  }
}
