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
  OpenSourceMindsetPageContent,
  PrivacyPolicyPageContent,
  TermsPageContent,
  TravelLandingPage,
  VanlifeLandingPage,
} from "@curolia/site/pages";
import { OpenSourceLicensesPageContent } from "@curolia/site/pages";
import type { ReactElement } from "react";

import type { PageMeta } from "@/ssr/render-document";
import type { StaticSsrRouteId } from "@/ssr/routes";

const DEFAULT_DESCRIPTION =
  "Curolia maps and maps your adventures — collaborative maps with pins, photos, and public blogs.";

const STATIC_META: Record<Exclude<StaticSsrRouteId, "campaign">, PageMeta> = {
  home: {
    title: "Curolia — map your adventures",
    description: DEFAULT_DESCRIPTION,
  },
  contact: {
    title: "Contact — Curolia",
    description: "Get in touch with the Curolia team.",
  },
  privacy: {
    title: "Privacy Policy — Curolia",
    description: "How Curolia collects, uses, and protects your data.",
  },
  terms: {
    title: "Terms and Conditions — Curolia",
    description: "Terms and conditions for using Curolia.",
  },
  openSource: {
    title: "Open source at Curolia",
    description:
      "How Curolia builds in the open and chooses privacy-respecting, open source services.",
  },
  licenses: {
    title: "Open source licenses — Curolia",
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
        title: "Curolia",
        description: DEFAULT_DESCRIPTION,
        robots: "noindex",
      };
    }
    return {
      title: `${campaign.title} — Curolia`,
      description: campaign.lead,
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
