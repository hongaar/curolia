-- Fine-grained pin metadata display: `{ "fields": ["place_type", …] }`.

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
      'email',
      'place_facts'
    )
  );

comment on column public.maps.show_pin_metadata is
  'Per-field pin metadata visibility for this map (`fields` string array). Does not affect plugin sync.';
