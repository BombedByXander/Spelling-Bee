-- Seed a large reusable challenge pool for random challenge surfacing.
-- Inserts 600 rows total (300 daily + 300 weekly), skipping any existing seeds.

insert into public.daily_weekly_challenges (
  challenge_type,
  title,
  description,
  seed,
  active,
  starts_at,
  ends_at
)
select
  'daily',
  format('Daily Challenge #%s', gs),
  format('Daily challenge #%s: complete your strongest run and submit your best weekly stats.', gs),
  format('auto_daily_%s', gs),
  true,
  now() - interval '1 day',
  now() + interval '365 days'
from generate_series(1, 300) as gs
where not exists (
  select 1
  from public.daily_weekly_challenges c
  where c.seed = format('auto_daily_%s', gs)
);

insert into public.daily_weekly_challenges (
  challenge_type,
  title,
  description,
  seed,
  active,
  starts_at,
  ends_at
)
select
  'weekly',
  format('Weekly Challenge #%s', gs),
  format('Weekly challenge #%s: push for higher score, speed, and consistency this week.', gs),
  format('auto_weekly_%s', gs),
  true,
  now() - interval '1 day',
  now() + interval '365 days'
from generate_series(1, 300) as gs
where not exists (
  select 1
  from public.daily_weekly_challenges c
  where c.seed = format('auto_weekly_%s', gs)
);
