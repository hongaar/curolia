-- Calendar-oriented connector stubs
insert into public.connector_types (id, display_name, description) values
  (
    'google_calendar',
    'Google Calendar',
    'Show pins on Google Calendar (coming soon).'
  ),
  (
    'ical',
    'iCalendar',
    'Publish pins as iCalendar (.ics) files (coming soon).'
  )
on conflict (id) do nothing;
