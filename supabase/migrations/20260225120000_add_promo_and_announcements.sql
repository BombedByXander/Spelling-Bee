-- Create promo_codes and promo_redemptions, and announcements tables
-- Adds a redeem function `redeem_promo_code(p_code text, p_user uuid)`

create table if not exists promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  stars integer not null default 0,
  uses integer not null default 0,
  max_uses integer,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz default now()
);

create table if not exists promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_id uuid references promo_codes(id) on delete cascade,
  user_id uuid not null,
  redeemed_at timestamptz default now()
);

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  starts_at timestamptz default now(),
  ends_at timestamptz,
  active boolean default true,
  created_by uuid,
  created_at timestamptz default now()
);

-- Function to safely redeem a promo code for a user.
create or replace function public.redeem_promo_code(p_code text, p_user uuid)
returns json as $$
declare
  pc record;
begin
  select * into pc from promo_codes where code = p_code for update;
  if not found then
    return json_build_object('ok', false, 'error', 'Invalid code');
  end if;

  -- check expiry
  if pc.expires_at is not null and pc.expires_at < now() then
    return json_build_object('ok', false, 'error', 'Code expired');
  end if;

  -- check per-user redemption
  if exists(select 1 from promo_redemptions where promo_id = pc.id and user_id = p_user) then
    return json_build_object('ok', false, 'error', 'Already redeemed');
  end if;

  -- check max uses
  if pc.max_uses is not null and pc.uses >= pc.max_uses then
    return json_build_object('ok', false, 'error', 'Code has been fully redeemed');
  end if;

  -- perform redemption: increment uses, insert redemption, add stars to profile
  update promo_codes set uses = uses + 1 where id = pc.id;
  insert into promo_redemptions(promo_id, user_id) values (pc.id, p_user);

  update profiles set stars = coalesce(stars, 0) + pc.stars where id = p_user;

  return json_build_object('ok', true, 'stars', pc.stars);
end;
$$ language plpgsql security definer;
