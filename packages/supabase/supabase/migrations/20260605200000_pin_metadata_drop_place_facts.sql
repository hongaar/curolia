-- Drop catch-all OSM "Details" metadata (place_facts).

delete from public.pin_metadata
where field_key = 'place_facts';

update public.maps
set show_pin_metadata = jsonb_set(
  show_pin_metadata,
  '{fields}',
  coalesce(
    (
      select jsonb_agg(elem order by elem)
      from jsonb_array_elements_text(
        coalesce(show_pin_metadata -> 'fields', '[]'::jsonb)
      ) as elem
      where elem <> 'place_facts'
    ),
    '[]'::jsonb
  )
)
where show_pin_metadata -> 'fields' ? 'place_facts';

alter table public.pin_metadata
  drop constraint pin_metadata_field_key_chk;

alter table public.pin_metadata
  add constraint pin_metadata_field_key_chk check (
    field_key in (
      'phone',
      'website',
      'opening_hours',
      'email',
      'place_type',
      'place_name',
      'cuisine',
      'wheelchair_access',
      'dog_policy',
      'brand',
      'operator',
      'dietary_options',
      'place_categories'
    )
  );

alter table public.maps
  alter column show_pin_metadata set default jsonb_build_object(
    'fields',
    jsonb_build_array(
      'place_name',
      'place_type',
      'cuisine',
      'dietary_options',
      'wheelchair_access',
      'dog_policy',
      'brand',
      'operator',
      'opening_hours',
      'phone',
      'website',
      'email'
    )
  );
