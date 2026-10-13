-- Rôles utilisateurs (admin / manager) et auteur des entrées de timeline.
-- Appliquée le 12 oct. 2026 via `supabase db query --linked -f`, puis
-- `migration repair --status applied 20261012150000`.

-- 1. admin_users : initiales + rôle contraint ------------------------------
alter table public.admin_users add column if not exists initials varchar(4);
alter table public.admin_users add column if not exists created_by uuid references auth.users(id);
update public.admin_users set role = 'super_admin' where role is null;
alter table public.admin_users drop constraint if exists admin_users_role_check;
alter table public.admin_users
  add constraint admin_users_role_check check (role in ('super_admin', 'admin', 'manager'));

-- Rôle du compte connecté. SECURITY DEFINER : lisible sans dépendre des
-- policies de admin_users (évite la récursion dans les policies).
create or replace function public.current_admin_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.admin_users
  where user_id = auth.uid() and is_active = true
  limit 1
$$;
revoke execute on function public.current_admin_role() from anon;

create or replace function public.is_admin_role()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_admin_role() in ('admin', 'super_admin'), false)
$$;
revoke execute on function public.is_admin_role() from anon;

-- Les admins voient tous les comptes (la policy existante ne montre que le sien).
-- Les écritures passent par l'Edge Function manage-users (service_role).
drop policy if exists "Admins can read all admin_users" on public.admin_users;
create policy "Admins can read all admin_users"
  on public.admin_users for select to authenticated
  using (public.is_admin_role());

-- 2. timeline : auteur -----------------------------------------------------
alter table public.timeline add column if not exists author_id uuid;
alter table public.timeline add column if not exists author_initials varchar(4);

-- Renseigne l'auteur à l'insertion depuis le compte connecté. Les insertions
-- anonymes (client) ou service_role (crons) restent sans auteur.
create or replace function public.set_timeline_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.author_id is null and auth.uid() is not null then
    select user_id,
           coalesce(nullif(initials, ''), upper(left(coalesce(name, email), 2)))
      into new.author_id, new.author_initials
      from public.admin_users
     where user_id = auth.uid() and is_active = true
     limit 1;
  end if;
  return new;
end;
$$;
revoke execute on function public.set_timeline_author() from anon, authenticated;

drop trigger if exists timeline_set_author on public.timeline;
create trigger timeline_set_author
  before insert on public.timeline
  for each row execute function public.set_timeline_author();

-- 3. Comptes ----------------------------------------------------------------
update public.admin_users set initials = 'ADM' where email = 'admin@busmoov.fr' and initials is null;

insert into public.admin_users (user_id, email, name, role, initials, is_active)
select u.id, u.email, 'Adrien Valentin', 'admin', 'AV', true
  from auth.users u
 where u.email = 'adrien.v@centrale-autocar.com'
on conflict (user_id) do update
  set role = 'admin', initials = 'AV', is_active = true,
      name = coalesce(public.admin_users.name, 'Adrien Valentin');
