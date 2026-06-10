import { campaigns } from "@curolia/site/content";

import {
  matchSsrRoute,
  SSR_STATIC_PATHNAMES,
  type StaticSsrRouteId,
} from "@/ssr/routes";
import { staticPageMeta } from "@/ssr/static-pages";

export type SsrSmokeRoute = {
  path: string;
  titleIncludes: string;
  bodyIncludes: string;
};

const SMOKE_BODY_BY_ID: Partial<
  Record<Exclude<StaticSsrRouteId, "campaign">, string>
> = {
  home: "map",
  openSource: "built in the open",
  licenses: "open source",
  contact: "touch",
};

function staticTitleNeedle(id: StaticSsrRouteId): string {
  const title = staticPageMeta(id).title.replace(/ — Curolia$/, "");
  // Titles may contain "&", which SSR escapes as "&amp;" in <title>.
  return title.replaceAll("&", "&amp;");
}

/** Production smoke paths for fixed static SSR routes (from {@link SSR_STATIC_PATHNAMES}). */
export function getStaticSsrSmokeRoutes(): SsrSmokeRoute[] {
  return SSR_STATIC_PATHNAMES.map((path) => {
    const match = matchSsrRoute(path);
    if (!match || match.kind !== "static" || match.id === "campaign") {
      throw new Error(`expected static SSR path: ${path}`);
    }
    const titleIncludes = staticTitleNeedle(match.id);
    return {
      path,
      titleIncludes,
      bodyIncludes: SMOKE_BODY_BY_ID[match.id] ?? titleIncludes,
    };
  });
}

/** One campaign landing path — pattern covers all `/for/:id` SSR routes. */
export function getCampaignSsrSmokeRoute(): SsrSmokeRoute {
  const campaign =
    campaigns.find((entry) => entry.id === "travel") ?? campaigns[0];
  if (!campaign) {
    throw new Error("no campaign defined for SSR smoke");
  }
  return {
    path: `/for/${campaign.id}`,
    titleIncludes: campaign.title,
    bodyIncludes: "map",
  };
}

export function getSsrSmokeRoutes(): SsrSmokeRoute[] {
  return [...getStaticSsrSmokeRoutes(), getCampaignSsrSmokeRoute()];
}
