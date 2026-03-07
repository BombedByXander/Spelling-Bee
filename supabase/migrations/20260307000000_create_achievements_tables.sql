-- Create achievements and user_achievements tables
create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null,
  icon text null,
  created_at timestamptz default now()
);

create table if not exists user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  achievement_id uuid references achievements(id) on delete cascade,
  unlocked_at timestamptz default now(),
  constraint user_achievement_unique unique(user_id, achievement_id)
);

-- Grant minimal permissions for authenticated users to read available achievements and insert their own unlocked rows
grant select on achievements to authenticated;
grant insert, select on user_achievements to authenticated;
