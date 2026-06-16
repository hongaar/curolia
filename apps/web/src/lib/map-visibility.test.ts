import { describe, expect, it } from "vitest";

import { resolveMapVisibility } from "./map-visibility";

describe("resolveMapVisibility", () => {
  it("returns public when the map is public", () => {
    expect(resolveMapVisibility({ is_public: true }, 1)).toBe("public");
    expect(resolveMapVisibility({ is_public: true }, 3)).toBe("public");
  });

  it("returns shared when collaborators exist on a private map", () => {
    expect(resolveMapVisibility({ is_public: false }, 2)).toBe("shared");
    expect(resolveMapVisibility({ is_public: false }, 5)).toBe("shared");
  });

  it("returns private when only the owner has access", () => {
    expect(resolveMapVisibility({ is_public: false }, 1)).toBe("private");
    expect(resolveMapVisibility({ is_public: false }, 0)).toBe("private");
  });
});
