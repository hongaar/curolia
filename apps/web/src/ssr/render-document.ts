import { escapeHtml } from "@/ssr/escape-html";

export type PageMeta = {
  title: string;
  description?: string;
  canonicalUrl?: string;
  robots?: string;
};

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

  let html = template.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${title}</title>`,
  );

  const headTags = [
    description ? `<meta name="description" content="${description}" />` : null,
    robots ? `<meta name="robots" content="${robots}" />` : null,
    canonical ? `<link rel="canonical" href="${canonical}" />` : null,
    description ? `<meta property="og:title" content="${title}" />` : null,
    description
      ? `<meta property="og:description" content="${description}" />`
      : null,
    canonical ? `<meta property="og:url" content="${canonical}" />` : null,
    `<meta property="og:type" content="website" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    description ? `<meta name="twitter:title" content="${title}" />` : null,
    description
      ? `<meta name="twitter:description" content="${description}" />`
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
