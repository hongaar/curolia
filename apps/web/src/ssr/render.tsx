import { pinDetailHref } from "@/lib/app-paths";
import {
  fetchPublicMapByRoute,
  fetchPublicMapOwnerProfile,
} from "@/lib/fetch-public-map";
import { mapRouteFromParts } from "@/lib/map-route";
import { resolvePinByMapSlug } from "@/lib/resolve-pin-slug";
import { renderBlogPageHtml } from "@/ssr/blog-page";
import { renderPinPageHtml } from "@/ssr/pin-page";
import { assembleHtml, type PageMeta } from "@/ssr/render-document";
import type { SsrRouteMatch } from "@/ssr/routes";
import { DEFAULT_OG_IMAGE, SITE_NAME } from "@/ssr/seo";
import { createServerSupabase } from "@/ssr/server-supabase";
import { renderStaticPage, staticPageMeta } from "@/ssr/static-pages";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";

export type SsrRenderResult = {
  status: number;
  html: string;
  headers?: Record<string, string>;
};

function joinOriginPath(origin: string, pathname: string): string {
  return `${origin.replace(/\/$/, "")}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export async function renderSsrRoute(
  match: SsrRouteMatch,
  pathname: string,
  origin: string,
  template: string,
): Promise<SsrRenderResult | null> {
  const canonicalUrl = joinOriginPath(origin, pathname);

  if (match.kind === "static") {
    const page = renderStaticPage(match.id, match.campaignId);
    if (!page) {
      return {
        status: 404,
        html: assembleHtml(
          template,
          {
            title: "Page not found — Curolia",
            description: "The requested page could not be found.",
            robots: "noindex",
          },
          "<main><h1>Page not found</h1></main>",
        ),
      };
    }

    const meta = staticPageMeta(match.id, match.campaignId);
    const bodyHtml = renderToString(
      <StaticRouter location={pathname}>{page}</StaticRouter>,
    );
    return {
      status: 200,
      html: assembleHtml(template, { ...meta, canonicalUrl }, bodyHtml),
    };
  }

  const client = createServerSupabase();

  if (match.kind === "blog") {
    const { profileSlug, mapSlug } = match;

    const map = await fetchPublicMapByRoute(profileSlug, mapSlug, client);
    if (!map) {
      return {
        status: 404,
        html: assembleHtml(
          template,
          {
            title: "Map not available — Curolia",
            description: "This map is private or does not exist.",
            robots: "noindex",
          },
          "<main><h1>Map not available</h1><p>This map is private or does not exist.</p></main>",
        ),
      };
    }

    const [owner, pinsResult] = await Promise.all([
      fetchPublicMapOwnerProfile(map.id, client),
      client
        .from("pins")
        .select("id, slug, title, description, date, end_date")
        .eq("map_id", map.id)
        .order("date", { ascending: true, nullsFirst: false }),
    ]);

    if (pinsResult.error) throw pinsResult.error;

    const mapName = map.name.trim() || mapSlug;
    const meta: PageMeta = {
      title: `${mapName} — ${SITE_NAME} blog`,
      description: owner?.bio
        ? `${mapName} by ${owner.displayName}. ${owner.bio}`
        : `Explore ${mapName}, a public travel map on ${SITE_NAME}.`,
      imageUrl: DEFAULT_OG_IMAGE,
      imageAlt: `${mapName} travel map on ${SITE_NAME}`,
    };

    const bodyHtml = renderBlogPageHtml({
      mapName,
      mapRoute: {
        profileSlug: map.owner_profile_slug,
        mapSlug: map.slug,
      },
      owner,
      pins: pinsResult.data ?? [],
    });

    return {
      status: 200,
      html: assembleHtml(template, { ...meta, canonicalUrl }, bodyHtml),
    };
  }

  const { profileSlug, mapSlug, pinSlug } = match;

  const map = await fetchPublicMapByRoute(profileSlug, mapSlug, client);
  if (!map) {
    return {
      status: 404,
      html: assembleHtml(
        template,
        {
          title: "Pin not available — Curolia",
          description: "This pin is on a private map or does not exist.",
          robots: "noindex",
        },
        "<main><h1>Pin not available</h1><p>This pin is on a private map or does not exist.</p></main>",
      ),
    };
  }

  const resolvedPin = await resolvePinByMapSlug(map.id, pinSlug, client);
  if (!resolvedPin) {
    return {
      status: 404,
      html: assembleHtml(
        template,
        {
          title: "Pin not found — Curolia",
          description: "This pin could not be found on the map.",
          robots: "noindex",
        },
        "<main><h1>Pin not found</h1><p>This pin could not be found on the map.</p></main>",
      ),
    };
  }

  if (resolvedPin.redirected) {
    const redirectPath = pinDetailHref(
      mapRouteFromParts(map.owner_profile_slug, map.slug),
      resolvedPin.canonicalSlug,
    );
    return {
      status: 301,
      headers: { Location: redirectPath },
      html: "",
    };
  }

  const { data: pin, error: pinError } = await client
    .from("pins")
    .select(
      "title, description, date, end_date, geocode, location_label_detail, lat, lng",
    )
    .eq("id", resolvedPin.pinId)
    .maybeSingle();
  if (pinError) throw pinError;
  if (!pin) {
    return {
      status: 404,
      html: assembleHtml(
        template,
        {
          title: "Pin not found — Curolia",
          robots: "noindex",
        },
        "<main><h1>Pin not found</h1></main>",
      ),
    };
  }

  const mapName = map.name.trim() || mapSlug;
  const pinTitle = pin.title?.trim() || "Untitled place";
  const meta: PageMeta = {
    title: `${pinTitle} — ${mapName} — ${SITE_NAME}`,
    description:
      pin.description?.trim().slice(0, 300) ||
      `${pinTitle} on ${mapName}, a public map on ${SITE_NAME}.`,
    imageUrl: DEFAULT_OG_IMAGE,
    imageAlt: pinTitle,
  };

  const bodyHtml = renderPinPageHtml({ mapName, pin });
  return {
    status: 200,
    html: assembleHtml(template, { ...meta, canonicalUrl }, bodyHtml),
  };
}
