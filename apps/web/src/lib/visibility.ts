import type { Database } from "@/lib/database.types";

export type Visibility = Database["public"]["Enums"]["visibility"];

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
  public:
    "Shown to other users, on What's new, and to search engines and AI agents.",
  unlisted:
    "Anyone with the link can view it. We ask search engines and AI agents not to index it.",
  private: "Only you and collaborators you invite.",
};

export const PROFILE_VISIBILITY_HINTS: Record<Visibility, string> = {
  public:
    "Shown to other users, in search and follow lists, and to search engines and AI agents.",
  unlisted:
    "Visible to people with the link or who follow you. We ask search engines and AI agents not to index it.",
  private: "Only you can see your profile.",
};

/** Public and unlisted content is viewable by anyone with the URL. */
export function isViewableByLink(visibility: Visibility): boolean {
  return visibility !== "private";
}

export function isVisibility(value: unknown): value is Visibility {
  return value === "public" || value === "unlisted" || value === "private";
}
