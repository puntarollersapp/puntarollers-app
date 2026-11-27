-- Accessories are independent of PATCH and the original profile photo.
create table public.pr_accessory_catalog (
 code text primary key check(code ~ '^[a-z0-9_-]+$'),
 title text not null,
 asset_file text not null unique check(asset_file ~* '^[^/\\\\]+[.]png$' and length(asset_file)<=200),
 unlock_description text not null,
 unlock_rule jsonb not null default '{}'::jsonb,
 enabled boolean not null default false,
 sort_order integer not null default 0
);
create table public.pr_accessory_grants (
 profile_id text not null references public.profiles(id),
 accessory_code text not null references public.pr_accessory_catalog(code),
 granted_at timestamptz not null default now(),
 source text not null,
 primary key(profile_id,accessory_code)
);
create table public.pr_accessory_equipped (
 profile_id text primary key references public.profiles(id),
 accessory_code text not null references public.pr_accessory_catalog(code),
 foreign key(profile_id,accessory_code) references public.pr_accessory_grants(profile_id,accessory_code) on delete cascade
);
alter table public.pr_accessory_catalog enable row level security;
alter table public.pr_accessory_grants enable row level security;
alter table public.pr_accessory_equipped enable row level security;
revoke all on public.pr_accessory_catalog,public.pr_accessory_grants,public.pr_accessory_equipped from anon,authenticated;
grant select on public.pr_accessory_catalog,public.pr_accessory_grants,public.pr_accessory_equipped to authenticated;
grant insert(profile_id,accessory_code),update(accessory_code),delete on public.pr_accessory_equipped to authenticated;
create policy pr_accessory_catalog_read on public.pr_accessory_catalog for select to authenticated using (
 enabled and (now()>='2026-12-01 00:00:00-03'::timestamptz or (public.pr_current_profile_id()='admin-claudio' and public.pr_frames_is_admin()))
);
create policy pr_accessory_own_grants on public.pr_accessory_grants for select to authenticated using (
 profile_id=public.pr_current_profile_id() and (now()>='2026-12-01 00:00:00-03'::timestamptz or (profile_id='admin-claudio' and public.pr_frames_is_admin()))
);
create policy pr_accessory_public_equipped on public.pr_accessory_equipped for select to authenticated using (
 (now()>='2026-12-01 00:00:00-03'::timestamptz or (profile_id='admin-claudio' and public.pr_current_profile_id()='admin-claudio' and public.pr_frames_is_admin())) and exists(select 1 from public.pr_accessory_catalog c where c.code=accessory_code and c.enabled)
);
create policy pr_accessory_equip_insert on public.pr_accessory_equipped for insert to authenticated with check (
 profile_id=public.pr_current_profile_id() and exists(select 1 from public.pr_accessory_grants g where g.profile_id=pr_accessory_equipped.profile_id and g.accessory_code=pr_accessory_equipped.accessory_code) and exists(select 1 from public.pr_accessory_catalog c where c.code=accessory_code and c.enabled)
);
create policy pr_accessory_equip_update on public.pr_accessory_equipped for update to authenticated using(profile_id=public.pr_current_profile_id()) with check (
 profile_id=public.pr_current_profile_id() and exists(select 1 from public.pr_accessory_grants g where g.profile_id=pr_accessory_equipped.profile_id and g.accessory_code=pr_accessory_equipped.accessory_code) and exists(select 1 from public.pr_accessory_catalog c where c.code=accessory_code and c.enabled)
);
create policy pr_accessory_unequip on public.pr_accessory_equipped for delete to authenticated using(profile_id=public.pr_current_profile_id());
-- Catalog and grants will be seeded from the official PNG filenames and verified rules.
