import { escapeHtml } from "@/ssr/escape-html";
import { SITE_NAME } from "@/ssr/seo";

export type PageMeta = {
  title: string;
  description?: string;
  canonicalUrl?: string;
  robots?: string;
  imageUrl?: string;
  imageAlt?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

function serializeJsonLd(
  jsonLd: Record<string, unknown> | Record<string, unknown>[],
): string {
  return JSON.stringify(jsonLd).replaceAll("<", "\\u003c");
}

export function assembleHtml(
  template: string,
  meta: PageMeta,
  bodyHtml: string,
): string {
  const title = escapeHtml(meta.title);
  const description = meta.description?.trim()
    ? escapeHtml(meta.description.trim())
    : null;
  const canonical = meta.canonicalUrl?.trim()
    ? escapeHtml(meta.canonicalUrl.trim())
    : null;
  const robots = meta.robots?.trim() ? escapeHtml(meta.robots.trim()) : null;
  const imageUrl = meta.imageUrl?.trim()
    ? escapeHtml(meta.imageUrl.trim())
    : null;
  const imageAlt = escapeHtml(meta.imageAlt?.trim() || SITE_NAME);

  let html = template.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${title}</title>`,
  );

  const headTags = [
    description ? `<meta name="description" content="${description}" />` : null,
    robots ? `<meta name="robots" content="${robots}" />` : null,
    canonical ? `<link rel="canonical" href="${canonical}" />` : null,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:title" content="${title}" />`,
    description
      ? `<meta property="og:description" content="${description}" />`
      : null,
    canonical ? `<meta property="og:url" content="${canonical}" />` : null,
    `<meta property="og:type" content="website" />`,
    imageUrl ? `<meta property="og:image" content="${imageUrl}" />` : null,
    imageUrl ? `<meta property="og:image:alt" content="${imageAlt}" />` : null,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    description
      ? `<meta name="twitter:description" content="${description}" />`
      : null,
    imageUrl ? `<meta name="twitter:image" content="${imageUrl}" />` : null,
    imageUrl ? `<meta name="twitter:image:alt" content="${imageAlt}" />` : null,
    meta.jsonLd
      ? `<script type="application/ld+json">${serializeJsonLd(meta.jsonLd)}</script>`
      : null,
  ]
    .filter(Boolean)
    .join("\n    ");

  html = html.replace("</head>", `    ${headTags}\n  </head>`);

  if (!html.includes('<div id="root"></div>')) {
    throw new Error('SSR template is missing <div id="root"></div>');
  }

  return html.replace(
    '<div id="root"></div>',
    `<div id="root">${bodyHtml}</div>`,
  );
}
