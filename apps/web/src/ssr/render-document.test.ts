import { describe, expect, it } from "vitest";

import { assembleHtml } from "@/ssr/render-document";

const TEMPLATE = `<!doctype html>
<html lang="en">
  <head>
    <title>Curolia</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

describe("assembleHtml", () => {
  it("injects title, meta tags, and rendered body HTML", () => {
    const html = assembleHtml(
      TEMPLATE,
      {
        title: "Paris — Europe — Curolia",
        description: "A pin on a public map.",
        canonicalUrl: "https://curolia.com/joram/europe/pin/paris",
      },
      "<main><h1>Paris</h1></main>",
    );

    expect(html).toContain("<title>Paris — Europe — Curolia</title>");
    expect(html).toContain(
      'name="description" content="A pin on a public map."',
    );
    expect(html).toContain(
      'rel="canonical" href="https://curolia.com/joram/europe/pin/paris"',
    );
    expect(html).toContain('property="og:site_name" content="Curolia"');
    expect(html).toContain(
      'property="og:title" content="Paris — Europe — Curolia"',
    );
    expect(html).toContain('<div id="root"><main><h1>Paris</h1></main></div>');
  });

  it("injects social images and JSON-LD when provided", () => {
    const html = assembleHtml(
      TEMPLATE,
      {
        title: "Curolia — Remember every place you go",
        description: "Map your adventures.",
        canonicalUrl: "https://curolia.com/",
        imageUrl: "https://curolia.com/og.png",
        imageAlt: "Curolia travel atlas",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Curolia",
        },
      },
      "<main></main>",
    );

    expect(html).toContain(
      'property="og:image" content="https://curolia.com/og.png"',
    );
    expect(html).toContain(
      'name="twitter:image" content="https://curolia.com/og.png"',
    );
    expect(html).toContain('<script type="application/ld+json">');
    expect(html).toContain('"@type":"WebSite"');
  });

  it("escapes unsafe HTML in metadata", () => {
    const html = assembleHtml(
      TEMPLATE,
      {
        title: 'Test "quotes" & <tags>',
        description: "Desc <script>",
      },
      "<main></main>",
    );

    expect(html).toContain(
      "<title>Test &quot;quotes&quot; &amp; &lt;tags&gt;</title>",
    );
    expect(html).toContain('content="Desc &lt;script&gt;"');
  });
});
