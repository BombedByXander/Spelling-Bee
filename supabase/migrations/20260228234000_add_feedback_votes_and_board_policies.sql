create table if not exists public.feedback_votes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  feedback_id uuid not null references public.feedback_submissions(id) on delete cascade,
  voter_key text not null,
  vote_type text not null check (vote_type in ('up', 'down')),
  constraint feedback_votes_unique_voter_per_feedback unique (feedback_id, voter_key)
);

alter table public.feedback_votes enable row level security;
alter table public.feedback_submissions enable row level security;

drop policy if exists "Admins can read feedback" on public.feedback_submissions;
drop policy if exists "Anyone can read feedback" on public.feedback_submissions;
drop policy if exists "Admins can delete feedback" on public.feedback_submissions;

create policy "Anyone can read feedback"
  on public.feedback_submissions
  for select
  to anon, authenticated
  using (true);

create policy "Admins can delete feedback"
  on public.feedback_submissions
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'::public.app_role
    )
  );

drop policy if exists "Anyone can read feedback votes" on public.feedback_votes;
drop policy if exists "Anyone can insert feedback votes" on public.feedback_votes;
drop policy if exists "Anyone can delete own-key feedback votes" on public.feedback_votes;

create policy "Anyone can read feedback votes"
  on public.feedback_votes
  for select
  to anon, authenticated
  using (true);

create policy "Anyone can insert feedback votes"
  on public.feedback_votes
  for insert
  to anon, authenticated
  with check (char_length(voter_key) > 0);

create policy "Anyone can delete own-key feedback votes"
  on public.feedback_votes
  for delete
  to anon, authenticated
  using (char_length(voter_key) > 0);
