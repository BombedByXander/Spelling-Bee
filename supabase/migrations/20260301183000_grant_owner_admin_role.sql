-- Ensure designated owner account can manage roles through existing admin RLS/policies
insert into public.user_roles (user_id, role)
select '87fd3816-b395-41f5-a5bf-5ad5b786d7c0'::uuid, 'admin'::public.app_role
where not exists (
  select 1
  from public.user_roles
  where user_id = '87fd3816-b395-41f5-a5bf-5ad5b786d7c0'::uuid
    and role = 'admin'::public.app_role
);
