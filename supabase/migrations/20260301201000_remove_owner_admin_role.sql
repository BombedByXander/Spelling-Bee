-- Remove legacy admin DB role from designated owner account.
-- Owner permissions are handled by application owner-role checks.

delete from public.user_roles
where user_id = '87fd3816-b395-41f5-a5bf-5ad5b786d7c0'::uuid
  and role = 'admin'::public.app_role;
