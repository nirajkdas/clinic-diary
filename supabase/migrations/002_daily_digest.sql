-- Evening "tomorrow" notification: pg_cron calls the daily-digest function every 15 minutes;
-- the function decides per clinic whether it's time (default 18:00 IST, set in the app) and sends once a day.
-- __PROJECT_URL__ is replaced by the deploy workflow.

alter table public.clinics add column if not exists last_digest date;

insert into public.app_keys(name, value)
values ('cron_token', encode(gen_random_bytes(24), 'hex'))
on conflict (name) do nothing;

do $outer$
begin
  begin
    create extension if not exists pg_cron;
    create extension if not exists pg_net with schema extensions;
  exception when others then
    raise notice 'pg_cron/pg_net not available: %', sqlerrm;
    return;
  end;

  if exists (select 1 from cron.job where jobname = 'clinic-daily-digest') then
    perform cron.unschedule('clinic-daily-digest');
  end if;

  perform cron.schedule(
    'clinic-daily-digest',
    '*/15 * * * *',
    $job$
      select net.http_post(
        url := '__PROJECT_URL__/functions/v1/daily-digest',
        headers := jsonb_build_object(
          'content-type', 'application/json',
          'x-cron-token', (select value from public.app_keys where name = 'cron_token')
        ),
        body := '{}'::jsonb
      );
    $job$
  );
end
$outer$;
