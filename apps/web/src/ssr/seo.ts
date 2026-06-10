import { campaigns } from "@curolia/site/content";

import { SSR_STATIC_PATHNAMES } from "@/ssr/ssr-route-paths";

/** Canonical production origin for sitemaps, JSON-LD, and default OG URLs. */
export const SITE_ORIGIN = "https://curolia.com";

export const SITE_NAME = "Curolia";

export const DEFAULT_TITLE = "Curolia — Remember every place you go";

export const DEFAULT_DESCRIPTION =
  "Curolia is an atlas for your explorations — map visits, write notes, collect photos, and revisit the story of your trips.";

/** Hero image sized for Open Graph / Twitter cards (1200px wide). */
export const DEFAULT_OG_IMAGE =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=630&q=80&auto=format&fit=crop";

const SPA_NOINDEX_PATHS = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
]);

const SPA_TITLES: Record<string, string> = {
  "/login": "Log in",
  "/signup": "Sign up",
  "/forgot-password": "Reset password",
  "/reset-password": "Choose a new password",
};

export type SpaPageMeta = {
  title: string;
  description?: string;
  robots: string;
};

export function absoluteUrl(origin: string, pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${origin.replace(/\/$/, "")}${path}`;
}

export function defaultOgImageUrl(origin: string): string {
  return absoluteUrl(origin, "/icon.png");
}

export function marketingSitemapPaths(): string[] {
  const campaignPaths = campaigns.map((campaign) => campaign.path);
  return [...SSR_STATIC_PATHNAMES, ...campaignPaths];
}

export function renderSitemapXml(
  origin: string = SITE_ORIGIN,
  lastmod = new Date().toISOString().slice(0, 10),
): string {
  const urls = marketingSitemapPaths()
    .map((path) => {
      const loc = absoluteUrl(origin, path);
      const priority =
        path === "/" ? "1.0" : path.startsWith("/for/") ? "0.8" : "0.6";
      const changefreq = path === "/" ? "weekly" : "monthly";
      return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function homePageJsonLd(
  origin: string = SITE_ORIGIN,
): Record<string, unknown> {
  const url = absoluteUrl(origin, "/");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}#website`,
        url,
        name: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        inLanguage: "en",
        publisher: { "@id": `${url}#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${url}#organization`,
        name: SITE_NAME,
        url,
        logo: absoluteUrl(origin, "/icon.png"),
        email: "hello@curolia.com",
        description:
          "Curolia builds a privacy-respecting digital atlas for travelers, families, and explorers.",
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "TravelApplication",
        operatingSystem: "Web",
        url,
        description: DEFAULT_DESCRIPTION,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        publisher: { "@id": `${url}#organization` },
      },
    ],
  };
}

export function matchSpaPageMeta(pathname: string): SpaPageMeta | null {
  const path =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  const titleStem = SPA_TITLES[path];
  if (titleStem) {
    return {
      title: `${titleStem} — ${SITE_NAME}`,
      robots: "noindex, nofollow",
    };
  }

  if (SPA_NOINDEX_PATHS.has(path)) {
    return {
      title: DEFAULT_TITLE,
      robots: "noindex, nofollow",
    };
  }

  // Authenticated app and other client-only routes should not be indexed.
  if (path !== "/" && !marketingSitemapPaths().includes(path)) {
    return {
      title: DEFAULT_TITLE,
      robots: "noindex, nofollow",
    };
  }

  return null;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
