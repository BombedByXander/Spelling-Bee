-- Ensure promo redemption RPC exists with stable signatures and permissions.
-- Also normalize code matching and force PostgREST schema reload.

create unique index if not exists promo_redemptions_unique_user_promo
  on public.promo_redemptions (promo_id, user_id);

create or replace function public.redeem_promo_code(p_code text, p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  pc public.promo_codes%rowtype;
  normalized_code text;
begin
  normalized_code := upper(trim(coalesce(p_code, '')));

  if normalized_code = '' then
    return jsonb_build_object('ok', false, 'error', 'Code is required');
  end if;

  if p_user is null then
    return jsonb_build_object('ok', false, 'error', 'User required');
  end if;

  select *
    into pc
  from public.promo_codes
  where upper(code) = normalized_code
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Invalid code');
  end if;

  if pc.expires_at is not null and pc.expires_at < now() then
    return jsonb_build_object('ok', false, 'error', 'Code expired');
  end if;

  if exists (
    select 1
    from public.promo_redemptions
    where promo_id = pc.id
      and user_id = p_user
  ) then
    return jsonb_build_object('ok', false, 'error', 'Already redeemed');
  end if;

  if pc.max_uses is not null and pc.uses >= pc.max_uses then
    return jsonb_build_object('ok', false, 'error', 'Code has been fully redeemed');
  end if;

  insert into public.promo_redemptions (promo_id, user_id)
  values (pc.id, p_user)
  on conflict (promo_id, user_id) do nothing;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Already redeemed');
  end if;

  update public.promo_codes
  set uses = uses + 1
  where id = pc.id;

  update public.profiles
  set stars = coalesce(stars, 0) + pc.stars
  where id = p_user;

  return jsonb_build_object('ok', true, 'stars', pc.stars);
end;
$$;

create or replace function public.redeem_promo_code(p_code text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.redeem_promo_code(p_code, auth.uid());
$$;

grant execute on function public.redeem_promo_code(text, uuid) to authenticated, anon;
grant execute on function public.redeem_promo_code(text) to authenticated, anon;

select pg_notify('pgrst', 'reload schema');
