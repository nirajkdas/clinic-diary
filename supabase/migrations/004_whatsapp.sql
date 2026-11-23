-- AiSensy (WhatsApp) settings per clinic. Write-only from the app, like the Edesy key.
alter table public.clinic_secrets add column if not exists aisensy_key text;
alter table public.clinic_secrets add column if not exists aisensy_campaign text;
alter table public.clinic_secrets add column if not exists aisensy_error text;

create or replace function public.set_aisensy(key text, campaign text) returns void
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  select m.clinic_id into cid from public.members m where m.user_id = auth.uid() limit 1;
  if cid is null then raise exception 'not a clinic member'; end if;
  insert into public.clinic_secrets(clinic_id, aisensy_key, aisensy_campaign, aisensy_error, updated_at)
  values (cid, nullif(trim(key), ''), nullif(trim(campaign), ''), null, now())
  on conflict (clinic_id) do update set
    aisensy_key = coalesce(nullif(trim(excluded.aisensy_key), ''), clinic_secrets.aisensy_key),
    aisensy_campaign = coalesce(nullif(trim(excluded.aisensy_campaign), ''), clinic_secrets.aisensy_campaign),
    aisensy_error = null, updated_at = now();
end $$;

drop function if exists public.wa_status();
create function public.wa_status() returns table(has_key boolean, campaign text, last_error text)
language sql stable security definer set search_path = public as $$
  select s.aisensy_key is not null, s.aisensy_campaign, s.aisensy_error
  from public.clinic_secrets s
  join public.members m on m.clinic_id = s.clinic_id and m.user_id = auth.uid()
  limit 1
$$;

revoke all on function public.set_aisensy(text, text) from public, anon;
revoke all on function public.wa_status() from public, anon;
grant execute on function public.set_aisensy(text, text), public.wa_status() to authenticated;
