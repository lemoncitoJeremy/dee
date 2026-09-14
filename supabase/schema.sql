create extension if not exists pgcrypto;

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  icon text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  date date not null,
  time time not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.dee_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text,
  icon text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.currently (
  id uuid primary key default gen_random_uuid(),
  listening_to text,
  craving text,
  watching text,
  thinking_about text,
  updated_at timestamptz not null default now()
);

create index if not exists schedules_date_activity_idx
  on public.schedules (date, activity_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists dee_questions_set_updated_at on public.dee_questions;
create trigger dee_questions_set_updated_at
before update on public.dee_questions
for each row execute function public.set_updated_at();

drop trigger if exists currently_set_updated_at on public.currently;
create trigger currently_set_updated_at
before update on public.currently
for each row execute function public.set_updated_at();

insert into public.activities (id, name, description, icon) values
  ('00000000-0000-0000-0000-000000000101', 'Matcha Girly', 'Feeling low on matcha or probably me?', '🍵'),
  ('00000000-0000-0000-0000-000000000102', 'Race Week', 'It’s race week. You know what that means.', '🏎️'),
  ('00000000-0000-0000-0000-000000000103', 'Spicy', 'Feeling a little spicy?', '🌶️'),
  ('00000000-0000-0000-0000-000000000104', 'Japanese Food', 'A little sushi wouldn’t hurt, right?', '🍣')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon;

insert into public.dee_questions (id, question, icon) values
  ('00000000-0000-0000-0000-000000000201', 'What’s your favorite drink?', '🍵'),
  ('00000000-0000-0000-0000-000000000202', 'What’s your favorite food?', '🍜'),
  ('00000000-0000-0000-0000-000000000203', 'What kind of music do you like?', '🎧'),
  ('00000000-0000-0000-0000-000000000204', 'What’s a movie or series you love?', '🎬'),
  ('00000000-0000-0000-0000-000000000205', 'What’s something that always makes you happy?', '🌷'),
  ('00000000-0000-0000-0000-000000000206', 'Where would you love to travel?', '✈️'),
  ('00000000-0000-0000-0000-000000000207', 'What’s something you’ve been thinking about lately?', '💭')
on conflict (id) do update set
  question = excluded.question,
  icon = excluded.icon;

insert into public.currently (id)
values ('00000000-0000-0000-0000-000000000301')
on conflict (id) do nothing;

alter table public.activities enable row level security;
alter table public.schedules enable row level security;
alter table public.dee_questions enable row level security;
alter table public.currently enable row level security;

drop policy if exists "public activities access" on public.activities;
create policy "public activities access" on public.activities
for all to anon using (true) with check (true);

drop policy if exists "public schedules access" on public.schedules;
create policy "public schedules access" on public.schedules
for all to anon using (true) with check (true);

drop policy if exists "public questions access" on public.dee_questions;
create policy "public questions access" on public.dee_questions
for all to anon using (true) with check (true);

drop policy if exists "public currently access" on public.currently;
create policy "public currently access" on public.currently
for all to anon using (true) with check (true);
