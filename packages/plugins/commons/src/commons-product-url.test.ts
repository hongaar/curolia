import { describe, expect, it } from "vitest";
import { commonsFilePageUrl, commonsProductUrl } from "./commons-product-url";

describe("commonsProductUrl", () => {
  it("prefers explicit productUrl", () => {
    expect(
      commonsProductUrl({
        productUrl: "https://commons.wikimedia.org/wiki/File:Foo.jpg",
        fileTitle: "File:Bar.jpg",
      }),
    ).toBe("https://commons.wikimedia.org/wiki/File:Foo.jpg");
  });

  it("builds from file title", () => {
    expect(
      commonsProductUrl({
        fileTitle: "File:Eiffel Tower.jpg",
      }),
    ).toBe("https://commons.wikimedia.org/wiki/File%3AEiffel_Tower.jpg");
  });
});

describe("commonsFilePageUrl", () => {
  it("replaces spaces with underscores", () => {
    expect(commonsFilePageUrl("File:Foo bar.jpg")).toBe(
      "https://commons.wikimedia.org/wiki/File%3AFoo_bar.jpg",
    );
  });
});
