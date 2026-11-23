-- WhatsApp provider choice (AiSensy or Interakt). The key/template reuse the aisensy_* columns.
alter table public.clinic_secrets add column if not exists wa_provider text not null default 'aisensy';

create or replace function public.set_whatsapp(provider text, key text, template text) returns void
language plpgsql security definer set search_path = public as $$
declare cid uuid; pv text := case when lower(trim(provider)) = 'interakt' then 'interakt' else 'aisensy' end;
begin
  select m.clinic_id into cid from public.members m where m.user_id = auth.uid() limit 1;
  if cid is null then raise exception 'not a clinic member'; end if;
  insert into public.clinic_secrets(clinic_id, wa_provider, aisensy_key, aisensy_campaign, aisensy_error, updated_at)
  values (cid, pv, nullif(trim(key), ''), nullif(trim(template), ''), null, now())
  on conflict (clinic_id) do update set
    aisensy_key = case when nullif(trim(excluded.aisensy_key), '') is not null then trim(excluded.aisensy_key)
                       when clinic_secrets.wa_provider = pv then clinic_secrets.aisensy_key else null end,
    aisensy_campaign = coalesce(nullif(trim(excluded.aisensy_campaign), ''), clinic_secrets.aisensy_campaign),
    wa_provider = pv, aisensy_error = null, updated_at = now();
end $$;

drop function if exists public.wa_status();
create function public.wa_status() returns table(has_key boolean, campaign text, last_error text, provider text)
language sql stable security definer set search_path = public as $$
  select s.aisensy_key is not null, s.aisensy_campaign, s.aisensy_error, s.wa_provider
  from public.clinic_secrets s
  join public.members m on m.clinic_id = s.clinic_id and m.user_id = auth.uid()
  limit 1
$$;

revoke all on function public.set_whatsapp(text, text, text) from public, anon;
revoke all on function public.wa_status() from public, anon;
grant execute on function public.set_whatsapp(text, text, text), public.wa_status() to authenticated;
