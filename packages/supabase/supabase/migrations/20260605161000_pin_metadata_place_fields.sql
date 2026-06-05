-- Extend provider-agnostic pin metadata with place-context fields.

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
      'place_facts',
      'place_categories'
    )
  );
