-- IELTS Max — Complete Standalone Supabase PostgreSQL Schema & Migrations
-- Parity with 24 Days of English + Admin Panel CMS, RLS, Storage, and RPCs

create extension if not exists "pgcrypto";

-- 1. GROUPS
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  open_days integer[] not null default '{}',
  created_at timestamptz not null default now()
);

-- 2. PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student', 'assistant', 'teacher', 'admin')),
  group_id uuid references public.groups(id) on delete set null,
  assistant_groups uuid[] not null default '{}',
  level text not null default 'A1',
  pace integer not null default 24 check (pace in (24, 48)),
  open_days integer[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on Supabase Auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Role helper functions
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('teacher', 'admin', 'assistant')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('teacher', 'admin')
  );
$$;

-- 3. COURSE DAYS (1..24)
create table if not exists public.days (
  n integer primary key check (n between 1 and 24),
  data jsonb not null default '{}'::jsonb,
  grammar2 jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- 4. ANSWER KEYS (Protected — revealed via RPC only after day submission or for staff)
create table if not exists public.answer_keys (
  n integer primary key references public.days(n) on delete cascade,
  answers jsonb not null default '[]'::jsonb,
  speak_answers jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- 5. IELTS & PLACEMENT TESTS
create table if not exists public.tests (
  id text primary key,
  title text not null,
  kind text not null check (kind in ('placement', 'listening', 'reading')),
  day integer check (day between 1 and 24),
  required boolean not null default false,
  reveal boolean not null default true,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 6. TEST ANSWER KEYS
create table if not exists public.test_keys (
  test_id text primary key references public.tests(id) on delete cascade,
  keys jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 7. TEST RESULTS
create table if not exists public.test_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  test_id text not null references public.tests(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'finished')),
  answers jsonb not null default '{}'::jsonb,
  flagged jsonb not null default '[]'::jsonb,
  score integer,
  total integer,
  band numeric(3,1),
  section_scores jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, test_id)
);

-- 8. DAILY SUBMISSIONS
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  n integer not null references public.days(n) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  podcast jsonb not null default '{}'::jsonb,
  article text not null default '',
  answers jsonb not null default '{}'::jsonb,
  speak_answers jsonb not null default '{}'::jsonb,
  writing jsonb not null default '{}'::jsonb,
  film_text text not null default '',
  cartoon_text text not null default '',
  reflection text not null default '',
  practice jsonb not null default '{}'::jsonb,
  teacher_note text not null default '',
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, n)
);

-- 9. WRITING FEEDBACK (AI + Teacher)
create table if not exists public.writing_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  n integer not null references public.days(n) on delete cascade,
  feedback jsonb not null default '{}'::jsonb,
  model jsonb not null default '{}'::jsonb,
  band numeric(3,1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, n)
);

-- 10. SPEAKING & FILM RECORDINGS
create table if not exists public.recordings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  n integer not null references public.days(n) on delete cascade,
  kind text not null default 'speaking' check (kind in ('speaking', 'film', 'cartoon')),
  path text not null,
  full_name text not null default '',
  seconds integer not null default 0,
  created_at timestamptz not null default now()
);

-- 11. MY WORDS (SRS VOCABULARY BANK)
create table if not exists public.vocab (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  word text not null,
  ipa text,
  uz text,
  en text,
  example text,
  day integer,
  status text not null default 'new' check (status in ('new', 'learning', 'mastered')),
  ease numeric(3,2) not null default 2.50,
  interval_days integer not null default 0,
  reps integer not null default 0,
  due_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, word)
);

-- 12. PRACTICE LOG
create table if not exists public.practice_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  at timestamptz not null default now(),
  kind text not null,
  word text,
  correct boolean not null default true,
  day integer
);

-- 13. HOMEWORK TIME TRACKING
create table if not exists public.homework_time (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  n integer not null references public.days(n) on delete cascade,
  seconds integer not null default 0,
  updated_at timestamptz not null default now(),
  unique(user_id, n)
);

-- 14. READING ROOM TABLES
create table if not exists public.reading_prefs (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  topics text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.reading_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  article text not null,
  level text not null default 'B1',
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(user_id, article, level)
);

create table if not exists public.reading_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  article text not null,
  unlocked_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.reading_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  article text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now()
);

-- 15. TELEGRAM LINKS
create table if not exists public.telegram_links (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  chat_id text,
  username text,
  settings jsonb not null default '{"daily_reminder": true}'::jsonb,
  linked_at timestamptz not null default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
alter table public.groups enable row level security;
alter table public.profiles enable row level security;
alter table public.days enable row level security;
alter table public.answer_keys enable row level security;
alter table public.tests enable row level security;
alter table public.test_keys enable row level security;
alter table public.test_results enable row level security;
alter table public.submissions enable row level security;
alter table public.writing_feedback enable row level security;
alter table public.recordings enable row level security;
alter table public.vocab enable row level security;
alter table public.practice_log enable row level security;
alter table public.homework_time enable row level security;
alter table public.reading_prefs enable row level security;
alter table public.reading_progress enable row level security;
alter table public.reading_unlocks enable row level security;
alter table public.reading_requests enable row level security;
alter table public.telegram_links enable row level security;

-- Public/Authenticated Read for Curriculum
create policy "days_read_auth" on public.days for select to authenticated using (true);
create policy "days_write_admin" on public.days for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "tests_read_auth" on public.tests for select to authenticated using (true);
create policy "tests_write_admin" on public.tests for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "groups_read_auth" on public.groups for select to authenticated using (true);
create policy "groups_write_admin" on public.groups for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Protected Answer Keys
create policy "answer_keys_staff" on public.answer_keys for all to authenticated using (public.is_staff()) with check (public.is_admin());
create policy "test_keys_staff" on public.test_keys for all to authenticated using (public.is_staff()) with check (public.is_admin());

-- Profiles
create policy "profiles_select_self_or_staff" on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff());
create policy "profiles_update_self_or_admin" on public.profiles for update to authenticated using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- Submissions, Writing Feedback, Vocab, Practice Log, Homework Time, Test Results
create policy "submissions_self_or_staff" on public.submissions for all to authenticated using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_admin());
create policy "writing_feedback_self_or_staff" on public.writing_feedback for all to authenticated using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_admin());
create policy "test_results_self_or_staff" on public.test_results for all to authenticated using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_admin());
create policy "vocab_self_or_staff" on public.vocab for all to authenticated using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid());
create policy "practice_log_self_or_staff" on public.practice_log for all to authenticated using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid());
create policy "homework_time_self_or_staff" on public.homework_time for all to authenticated using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid());

-- Recordings (coursemates can listen to each other)
create policy "recordings_read_auth" on public.recordings for select to authenticated using (true);
create policy "recordings_write_self" on public.recordings for insert to authenticated with check (user_id = auth.uid());
create policy "recordings_delete_self_or_admin" on public.recordings for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- Reading Room
create policy "reading_prefs_self_or_staff" on public.reading_prefs for all to authenticated using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid());
create policy "reading_progress_self_or_staff" on public.reading_progress for all to authenticated using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid());
create policy "reading_unlocks_read_auth" on public.reading_unlocks for select to authenticated using (true);
create policy "reading_unlocks_write_admin" on public.reading_unlocks for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "reading_requests_self_or_staff" on public.reading_requests for all to authenticated using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_admin());
create policy "telegram_links_self" on public.telegram_links for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================
create or replace function public.server_now()
returns timestamptz
language sql
stable
as $$ select now(); $$;

create or replace function public.my_answer_keys()
returns table(n integer, answers jsonb, speak_answers jsonb)
language sql
security definer
set search_path = public
as $$
  select ak.n, ak.answers, ak.speak_answers
  from public.answer_keys ak
  where public.is_staff()
     or exists (
       select 1 from public.submissions s
       where s.user_id = auth.uid() and s.n = ak.n and s.status = 'submitted'
     )
  order by ak.n;
$$;

create or replace function public.set_my_pace(p_pace integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_pace not in (24, 48) then
    raise exception 'Invalid pace';
  end if;
  update public.profiles set pace = p_pace, updated_at = now() where id = auth.uid();
end;
$$;

create or replace function public.choose_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set group_id = p_group_id, updated_at = now() where id = auth.uid();
end;
$$;

create or replace function public.set_open_days(p_target_type text, p_target_id uuid, p_days integer[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin permission required';
  end if;
  if p_target_type = 'group' then
    update public.groups set open_days = p_days where id = p_target_id;
  elsif p_target_type = 'student' then
    update public.profiles set open_days = p_days, updated_at = now() where id = p_target_id;
  end if;
end;
$$;

create or replace function public.hw_time(p_day integer, p_add_seconds integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_total integer;
begin
  insert into public.homework_time (user_id, n, seconds, updated_at)
  values (auth.uid(), p_day, greatest(0, p_add_seconds), now())
  on conflict (user_id, n) do update
    set seconds = public.homework_time.seconds + greatest(0, p_add_seconds),
        updated_at = now()
  returning seconds into new_total;
  return new_total;
end;
$$;

create or replace function public.class_ranking()
returns table(
  user_id uuid,
  full_name text,
  group_id uuid,
  submitted_days bigint,
  tests_done bigint,
  points numeric
)
language sql
security definer
set search_path = public
as $$
  select
    p.id as user_id,
    p.full_name,
    p.group_id,
    coalesce((select count(*) from public.submissions s where s.user_id = p.id and s.status = 'submitted'), 0) as submitted_days,
    coalesce((select count(*) from public.test_results tr where tr.user_id = p.id and tr.status = 'finished'), 0) as tests_done,
    (
      coalesce((select count(*) from public.submissions s where s.user_id = p.id and s.status = 'submitted'), 0) * 15
      + coalesce((select sum(coalesce(tr.band, 5.0) * 2) from public.test_results tr where tr.user_id = p.id and tr.status = 'finished'), 0)
    )::numeric as points
  from public.profiles p
  where p.role = 'student'
  order by points desc, submitted_days desc;
$$;

-- Storage Buckets (safe upsert)
insert into storage.buckets (id, name, public)
values
  ('speaking', 'speaking', true),
  ('film-talks', 'film-talks', true),
  ('task-files', 'task-files', true),
  ('task-images', 'task-images', true)
on conflict (id) do nothing;

-- Backfill any pre-created auth.users into public.profiles
insert into public.profiles (id, email, full_name, role, open_days)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  coalesce(u.raw_user_meta_data->>'role', 'student'),
  case
    when coalesce(u.raw_user_meta_data->>'role', 'student') in ('admin', 'teacher')
      then array[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]
    else array[1]
  end
from auth.users u
on conflict (id) do update
  set role = excluded.role,
      full_name = excluded.full_name,
      open_days = excluded.open_days,
      updated_at = now();

