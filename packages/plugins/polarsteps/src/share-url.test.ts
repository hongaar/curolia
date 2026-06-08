import { describe, expect, it } from "vitest";
import { parsePolarstepsShareUrl, tripOptionId } from "./share-url";

describe("parsePolarstepsShareUrl", () => {
  it("parses public trip URL", () => {
    const parsed = parsePolarstepsShareUrl(
      "https://www.polarsteps.com/Alice/12345678-new-zealand",
    );
    expect(parsed).toEqual({
      tripId: "12345678",
      secret: undefined,
      shareUrl: "https://www.polarsteps.com/Alice/12345678-new-zealand",
    });
  });

  it("parses private trip URL with secret", () => {
    const parsed = parsePolarstepsShareUrl(
      "https://polarsteps.com/Bob/9876543-europe?s=abc123",
    );
    expect(parsed?.tripId).toBe("9876543");
    expect(parsed?.secret).toBe("abc123");
  });

  it("rejects invalid URLs", () => {
    expect(parsePolarstepsShareUrl("not-a-url")).toBeNull();
    expect(parsePolarstepsShareUrl("https://example.com/1-trip")).toBeNull();
  });
});

describe("tripOptionId", () => {
  it("uses trip id as option id", () => {
    expect(tripOptionId("12345")).toBe("12345");
  });
});
