create table if not exists public.clans (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  icon text not null default '👥',
  tag text not null,
  min_level integer not null default 1,
  constraint clans_name_length_check check (char_length(name) between 3 and 32),
  constraint clans_tag_length_check check (char_length(tag) between 2 and 8),
  constraint clans_min_level_check check (min_level between 1 and 10000),
  constraint clans_owner_unique unique (owner_id),
  constraint clans_name_unique unique (lower(name)),
  constraint clans_tag_unique unique (upper(tag))
);

create table if not exists public.clan_members (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  clan_id uuid not null references public.clans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'officer', 'member')),
  constraint clan_members_unique_user unique (user_id),
  constraint clan_members_unique_pair unique (clan_id, user_id)
);

create table if not exists public.daily_weekly_challenges (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  challenge_type text not null check (challenge_type in ('daily', 'weekly')),
  title text not null,
  description text not null,
  seed text not null,
  active boolean not null default true,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  constraint challenges_window_check check (ends_at > starts_at)
);

create table if not exists public.challenge_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  challenge_id uuid not null references public.daily_weekly_challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null default 0,
  wpm numeric not null default 0,
  accuracy numeric not null default 0,
  constraint challenge_submissions_unique unique (challenge_id, user_id)
);

create table if not exists public.run_replays (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  share_code text not null unique,
  author_id uuid null references auth.users(id) on delete set null,
  mode text not null,
  summary jsonb not null default '{}'::jsonb,
  events jsonb not null default '[]'::jsonb
);

alter table public.clans enable row level security;
alter table public.clan_members enable row level security;
alter table public.daily_weekly_challenges enable row level security;
alter table public.challenge_submissions enable row level security;
alter table public.run_replays enable row level security;

drop policy if exists "Anyone can read clans" on public.clans;
drop policy if exists "Authenticated can create clans" on public.clans;
drop policy if exists "Owners can update clans" on public.clans;
drop policy if exists "Owners can delete clans" on public.clans;

create policy "Anyone can read clans"
  on public.clans
  for select
  to anon, authenticated
  using (true);

create policy "Authenticated can create clans"
  on public.clans
  for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Owners can update clans"
  on public.clans
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Owners can delete clans"
  on public.clans
  for delete
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "Anyone can read clan members" on public.clan_members;
drop policy if exists "Authenticated can join self" on public.clan_members;
drop policy if exists "Owners can manage members" on public.clan_members;
drop policy if exists "Users can leave own clan" on public.clan_members;

create policy "Anyone can read clan members"
  on public.clan_members
  for select
  to anon, authenticated
  using (true);

create policy "Authenticated can join self"
  on public.clan_members
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Owners can manage members"
  on public.clan_members
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.clans c
      where c.id = clan_members.clan_id
        and c.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.clans c
      where c.id = clan_members.clan_id
        and c.owner_id = auth.uid()
    )
  );

create policy "Users can leave own clan"
  on public.clan_members
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Anyone can read challenges" on public.daily_weekly_challenges;
drop policy if exists "Admins can manage challenges" on public.daily_weekly_challenges;

create policy "Anyone can read challenges"
  on public.daily_weekly_challenges
  for select
  to anon, authenticated
  using (true);

create policy "Admins can manage challenges"
  on public.daily_weekly_challenges
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'::public.app_role
    )
  )
  with check (
    exists (
      select 1
      from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'::public.app_role
    )
  );

drop policy if exists "Anyone can read challenge submissions" on public.challenge_submissions;
drop policy if exists "Users can submit own challenge score" on public.challenge_submissions;

create policy "Anyone can read challenge submissions"
  on public.challenge_submissions
  for select
  to anon, authenticated
  using (true);

create policy "Users can submit own challenge score"
  on public.challenge_submissions
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can update own challenge score" on public.challenge_submissions;
create policy "Users can update own challenge score"
  on public.challenge_submissions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Anyone can read replays" on public.run_replays;
drop policy if exists "Anyone can insert replays" on public.run_replays;
drop policy if exists "Owners can delete own replays" on public.run_replays;

create policy "Anyone can read replays"
  on public.run_replays
  for select
  to anon, authenticated
  using (true);

create policy "Anyone can insert replays"
  on public.run_replays
  for insert
  to anon, authenticated
  with check (true);

create policy "Owners can delete own replays"
  on public.run_replays
  for delete
  to authenticated
  using (author_id = auth.uid());
