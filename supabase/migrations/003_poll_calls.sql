-- Edesy Call Forwarding has no webhooks: the server polls its call-log API every minute.
-- The clinic's Edesy API key is write-only from the app (set via set_edesy_key, never readable by clients).

create table if not exists public.clinic_secrets (
  clinic_id   uuid primary key references public.clinics(id) on delete cascade,
  edesy_key   text,
  edesy_since timestamptz,
  edesy_error text,
  updated_at  timestamptz not null default now()
);
alter table public.clinic_secrets enable row level security;  -- no policies: clients can't read or write directly
grant all on public.clinic_secrets to service_role;

create or replace function public.set_edesy_key(key text) returns void
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  select m.clinic_id into cid from public.members m where m.user_id = auth.uid() limit 1;
  if cid is null then raise exception 'not a clinic member'; end if;
  insert into public.clinic_secrets(clinic_id, edesy_key, edesy_since, edesy_error, updated_at)
  values (cid, nullif(trim(key), ''), null, null, now())
  on conflict (clinic_id) do update set edesy_key = excluded.edesy_key, edesy_since = null, edesy_error = null, updated_at = now();
end $$;

-- What the app may know: whether a key is saved, the last sync time and the last error. Never the key.
create or replace function public.edesy_status() returns table(has_key boolean, last_sync timestamptz, last_error text)
language sql stable security definer set search_path = public as $$
  select s.edesy_key is not null, s.edesy_since, s.edesy_error
  from public.clinic_secrets s
  join public.members m on m.clinic_id = s.clinic_id and m.user_id = auth.uid()
  limit 1
$$;

revoke all on function public.set_edesy_key(text) from public, anon;
revoke all on function public.edesy_status() from public, anon;
grant execute on function public.set_edesy_key(text), public.edesy_status() to authenticated;

do $outer$
begin
  begin
    create extension if not exists pg_cron;
    create extension if not exists pg_net with schema extensions;
  exception when others then
    raise notice 'pg_cron/pg_net not available: %', sqlerrm;
    return;
  end;
  if exists (select 1 from cron.job where jobname = 'clinic-poll-calls') then
    perform cron.unschedule('clinic-poll-calls');
  end if;
  perform cron.schedule(
    'clinic-poll-calls',
    '* * * * *',
    $job$
      select net.http_post(
        url := '__PROJECT_URL__/functions/v1/poll-calls',
        headers := jsonb_build_object(
          'content-type', 'application/json',
          'x-cron-token', (select value from public.app_keys where name = 'cron_token')
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 25000
      );
    $job$
  );
end
$outer$;
