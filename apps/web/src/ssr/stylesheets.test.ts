import { describe, expect, it } from "vitest";

import { injectStylesheetHrefs, parseStylesheetHrefs } from "@/ssr/stylesheets";

const TEMPLATE = `<!doctype html>
<html>
  <head>
    <link rel="stylesheet" crossorigin href="/assets/main.css" />
  </head>
  <body></body>
</html>`;

describe("injectStylesheetHrefs", () => {
  it("adds missing stylesheet links before </head>", () => {
    const html = injectStylesheetHrefs(TEMPLATE, [
      "/assets/main.css",
      "/assets/markdown.css",
    ]);

    expect(parseStylesheetHrefs(html)).toEqual(
      new Set(["/assets/main.css", "/assets/markdown.css"]),
    );
    expect(html).toContain('href="/assets/markdown.css"');
  });

  it("does not duplicate existing links", () => {
    const html = injectStylesheetHrefs(TEMPLATE, ["/assets/main.css"]);
    expect(html.match(/main\.css/g)?.length).toBe(1);
  });
});
