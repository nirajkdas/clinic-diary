-- Clinic Diary: cloud schema
-- One clinic has members (the dentist, later a helper). All app data lives in `records`
-- as JSON documents keyed by (clinic, kind, id), so the app and the call webhooks share one shape.

create extension if not exists pgcrypto;

create table if not exists public.clinics (
  id            uuid primary key default gen_random_uuid(),
  name          text not null default 'My Dental Clinic',
  settings      jsonb not null default '{}'::jsonb,          -- {set, rules, tpl} from the app
  connect_to    text,                                       -- phone that the clinic line rings (her personal number)
  webhook_token text not null unique default encode(gen_random_bytes(18), 'hex'),
  created_at    timestamptz not null default now()
);

create table if not exists public.members (
  clinic_id  uuid not null references public.clinics(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'owner',
  primary key (clinic_id, user_id)
);

create table if not exists public.records (
  clinic_id  uuid not null references public.clinics(id) on delete cascade,
  kind       text not null check (kind in ('patients','appts','fus','leads','calls')),
  id         text not null,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (clinic_id, kind, id)
);
create index if not exists records_clinic_kind on public.records (clinic_id, kind);
alter table public.records replica identity full;

create table if not exists public.push_subs (
  endpoint   text primary key,
  clinic_id  uuid not null references public.clinics(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  sub        jsonb not null,
  created_at timestamptz not null default now()
);

-- Server-only secrets (VAPID keys). RLS on with no policies = invisible to app users.
create table if not exists public.app_keys (
  name  text primary key,
  value text not null
);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists records_touch on public.records;
create trigger records_touch before update on public.records for each row execute function public.touch_updated_at();

create or replace function public.is_member(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members m where m.clinic_id = c and m.user_id = auth.uid())
$$;

-- Called once by the app after first sign-in: makes a clinic and adds the user as owner.
create or replace function public.create_clinic(clinic_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select m.clinic_id into cid from public.members m where m.user_id = auth.uid() limit 1;
  if cid is not null then return cid; end if;
  insert into public.clinics(name) values (coalesce(nullif(clinic_name,''),'My Dental Clinic')) returning id into cid;
  insert into public.members(clinic_id, user_id, role) values (cid, auth.uid(), 'owner');
  return cid;
end $$;

alter table public.clinics   enable row level security;
alter table public.members   enable row level security;
alter table public.records   enable row level security;
alter table public.push_subs enable row level security;
alter table public.app_keys  enable row level security;

drop policy if exists clinics_rw on public.clinics;
create policy clinics_rw on public.clinics for all using (public.is_member(id)) with check (public.is_member(id));
drop policy if exists members_read on public.members;
create policy members_read on public.members for select using (user_id = auth.uid() or public.is_member(clinic_id));
drop policy if exists records_rw on public.records;
create policy records_rw on public.records for all using (public.is_member(clinic_id)) with check (public.is_member(clinic_id));
drop policy if exists push_own on public.push_subs;
create policy push_own on public.push_subs for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_member(clinic_id));

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.clinics, public.records, public.push_subs to authenticated;
grant select on public.members to authenticated;
grant execute on function public.create_clinic(text) to authenticated;
grant execute on function public.is_member(uuid) to authenticated;

-- Live updates for the app (new calls and leads appear without refresh)
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.records; exception when duplicate_object then null; end;
  end if;
end $$;
