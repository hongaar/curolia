import type { Database } from "@/lib/database.types";

/** Map visibility. */
export type Visibility = Database["public"]["Enums"]["visibility"];
export type ProfileVisibility =
  Database["public"]["Enums"]["profile_visibility"];

export const VISIBILITY_OPTIONS: readonly Visibility[] = [
  "public",
  "unlisted",
  "private",
];

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  public: "Public",
  unlisted: "Unlisted",
  private: "Private",
};

export const MAP_VISIBILITY_HINTS: Record<Visibility, string> = {
  public: "Visible to anyone, including search engines and AI agents.",
  unlisted:
    "Visible to anyone with the link. Search engines and AI agents are asked not to index this map.",
  private: "Visible only to members of this map.",
};

export const PROFILE_VISIBILITY_OPTIONS: readonly ProfileVisibility[] = [
  "public",
  "restricted",
  "private",
];

export const PROFILE_VISIBILITY_LABELS: Record<ProfileVisibility, string> = {
  public: "Public",
  restricted: "Restricted",
  private: "Private",
};

export const PROFILE_VISIBILITY_HINTS: Record<ProfileVisibility, string> = {
  public: "Visible to anyone, including search engines and AI agents.",
  restricted:
    "Only followers you approve can see your profile. Search engines and AI agents are asked not to index your profile.",
  private: "Only you can see your profile.",
};

/** Longer explanation for the Restricted option, shown in a "Learn more" tip. */
export const PROFILE_RESTRICTED_DETAILS =
  "Signed-in users can see your name and avatar and request to follow you. You approve each request. Approved followers see your maps and follow lists.";

/** Public and unlisted maps are viewable by anyone with the URL. */
export function isViewableByLink(visibility: Visibility): boolean {
  return visibility !== "private";
}

export function isVisibility(value: unknown): value is Visibility {
  return value === "public" || value === "unlisted" || value === "private";
}
