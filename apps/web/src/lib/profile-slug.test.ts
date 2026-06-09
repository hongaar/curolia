import { describe, expect, it } from "vitest";
import { profileSlugSaveErrorMessage } from "./profile-slug";

describe("profileSlugSaveErrorMessage", () => {
  it("maps profile_slug_redirects RLS errors", () => {
    expect(
      profileSlugSaveErrorMessage({
        message:
          'new row violates row-level security policy for table "profile_slug_redirects"',
      }),
    ).toBe("That profile URL is already taken. Try a different one.");
  });

  it("maps unique profile slug violations", () => {
    expect(
      profileSlugSaveErrorMessage({
        code: "23505",
        message:
          'duplicate key value violates unique constraint "profiles_slug_key"',
      }),
    ).toBe("That profile URL is already taken. Try a different one.");
  });
});
