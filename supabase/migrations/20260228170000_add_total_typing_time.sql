-- Add cumulative typing time tracking to profiles and expose a safe increment RPC.

alter table public.profiles
  add column if not exists total_typing_seconds integer not null default 0;

create or replace function public.add_typing_time(p_seconds integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_seconds is null or p_seconds <= 0 then
    return;
  end if;

  update public.profiles
  set total_typing_seconds = coalesce(total_typing_seconds, 0) + p_seconds
  where id = auth.uid();
end;
$$;

grant execute on function public.add_typing_time(integer) to authenticated;

select pg_notify('pgrst', 'reload schema');
