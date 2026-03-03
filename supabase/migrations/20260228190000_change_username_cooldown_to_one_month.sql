-- Change username cooldown from 2 months to 1 month.

create or replace function public.change_username(p_new_username text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_last_change timestamptz;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if length(p_new_username) < 3 or length(p_new_username) > 20 then
    raise exception 'Username must be 3-20 chars';
  end if;

  select username_changed_at into v_last_change
  from public.profiles
  where id = v_user_id;

  if v_last_change is not null and v_last_change > now() - interval '1 month' then
    return false;
  end if;

  update public.profiles
  set username = p_new_username,
      username_changed_at = now()
  where id = v_user_id;

  return true;
end;
$$;

grant execute on function public.change_username(text) to authenticated;

select pg_notify('pgrst', 'reload schema');
