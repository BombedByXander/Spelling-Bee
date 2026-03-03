create table if not exists public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid null,
  display_name text null,
  message text not null,
  constraint feedback_submissions_message_length_check
    check (char_length(message) between 6 and 600),
  constraint feedback_submissions_no_curses_check
    check (lower(message) !~ '(fuck|fucking|shit|bitch|asshole|bastard|dick|pussy|cunt|motherfucker)')
);

alter table public.feedback_submissions enable row level security;

create policy "Anyone can submit feedback"
  on public.feedback_submissions
  for insert
  to anon, authenticated
  with check (true);

create policy "Admins can read feedback"
  on public.feedback_submissions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'::public.app_role
    )
  );
