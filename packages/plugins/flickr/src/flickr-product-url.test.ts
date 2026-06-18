import { describe, expect, it } from "vitest";
import { flickrProductUrl } from "./flickr-product-url";

describe("flickrProductUrl", () => {
  it("prefers explicit productUrl", () => {
    expect(
      flickrProductUrl({
        productUrl: "https://www.flickr.com/photos/foo/123",
        photoId: "999",
      }),
    ).toBe("https://www.flickr.com/photos/foo/123");
  });

  it("builds from path alias", () => {
    expect(
      flickrProductUrl({
        photoId: "123",
        pathAlias: "joram",
      }),
    ).toBe("https://www.flickr.com/photos/joram/123");
  });

  it("falls back to owner nsid", () => {
    expect(
      flickrProductUrl({
        photoId: "123",
        owner: "12345@N00",
      }),
    ).toBe("https://www.flickr.com/photos/12345%40N00/123");
  });
});
