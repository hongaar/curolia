export type PinReactionRow = {
  id: string;
  pin_id: string;
  map_id: string;
  user_id: string | null;
  guest_id: string | null;
  emoji: string;
  created_at: string;
};

export type ReactionGroup = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
  reactionId: string | null;
};
