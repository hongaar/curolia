-- Convert legacy `{ food, accessibility, outdoor }` show metadata to `{ fields: [...] }`.

with legacy as (
  select
    id,
    coalesce((show_pin_metadata -> 'food')::boolean, true) as food,
    coalesce((show_pin_metadata -> 'accessibility')::boolean, true) as accessibility,
    coalesce((show_pin_metadata -> 'outdoor')::boolean, true) as outdoor
  from public.maps
  where show_pin_metadata ? 'food'
     or show_pin_metadata ? 'accessibility'
     or show_pin_metadata ? 'outdoor'
),
field_rows as (
  select
    legacy.id,
    field_key,
    case field_key
      when 'cuisine' then legacy.food
      when 'dietary_options' then legacy.food
      when 'wheelchair_access' then legacy.accessibility
      when 'dog_policy' then legacy.accessibility
      when 'place_type' then legacy.food or legacy.outdoor
      else true
    end as include_field
  from legacy
  cross join (
    values
      ('place_name'),
      ('place_type'),
      ('cuisine'),
      ('dietary_options'),
      ('wheelchair_access'),
      ('dog_policy'),
      ('brand'),
      ('operator'),
      ('opening_hours'),
      ('phone'),
      ('website'),
      ('email'),
      ('place_facts')
  ) as fields(field_key)
),
converted as (
  select
    id,
    jsonb_build_object(
      'fields',
      coalesce(
        jsonb_agg(field_key order by field_key)
          filter (where include_field),
        '[]'::jsonb
      )
    ) as new_settings
  from field_rows
  group by id
)
update public.maps m
set show_pin_metadata = c.new_settings
from converted c
where m.id = c.id;
