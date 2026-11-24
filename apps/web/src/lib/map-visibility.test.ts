import { describe, expect, it } from "vitest";

import { resolveMapVisibility } from "./map-visibility";

describe("resolveMapVisibility", () => {
  it("returns public or unlisted when the map is viewable by link", () => {
    expect(resolveMapVisibility({ visibility: "public" }, 1)).toBe("public");
    expect(resolveMapVisibility({ visibility: "public" }, 3)).toBe("public");
    expect(resolveMapVisibility({ visibility: "unlisted" }, 3)).toBe(
      "unlisted",
    );
  });

  it("returns shared when collaborators exist on a private map", () => {
    expect(resolveMapVisibility({ visibility: "private" }, 2)).toBe("shared");
    expect(resolveMapVisibility({ visibility: "private" }, 5)).toBe("shared");
  });

  it("returns private when only the owner has access", () => {
    expect(resolveMapVisibility({ visibility: "private" }, 1)).toBe("private");
    expect(resolveMapVisibility({ visibility: "private" }, 0)).toBe("private");
  });
});
