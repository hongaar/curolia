-- Google Maps saved lists: one-time import only (remove daily sync cron).

do $$
begin
  perform cron.unschedule('google-maps-saved-lists-sync');
exception
  when undefined_object then null;
  when others then null;
end $$;

drop function if exists private.invoke_google_maps_saved_lists_sync();
