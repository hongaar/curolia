export type PinCommentAuthorProfile = {
  avatar_url: string | null;
  gravatar_hash: string | null;
  slug: string | null;
};

export type PinCommentRow = {
  id: string;
  pin_id: string;
  map_id: string;
  author_user_id: string | null;
  author_display_name: string;
  author_guest_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  author_profile: PinCommentAuthorProfile | null;
};
