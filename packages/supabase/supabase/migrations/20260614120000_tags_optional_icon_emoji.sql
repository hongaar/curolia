-- Tags may exist without an icon/emoji. Markers fall back to a solid tag color
-- (no glyph) when a tag has no emoji, so the emoji is now optional.
alter table public.tags
  alter column icon_emoji drop not null,
  alter column icon_emoji drop default;
