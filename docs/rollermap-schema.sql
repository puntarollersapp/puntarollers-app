create table public.pr_rollermap_locations (
id uuid primary key default gen_random_uuid(), created_at timestamptz default now(),
name text not null,type text not null check(type in ('escuela','grupo')),description text,city text not null,department text,address text,
lat double precision,lng double precision,instagram text,whatsapp text,schedule text,status text not null default 'pending' check(status in ('pending','approved','disabled')),
verified boolean not null default false,featured boolean not null default false,image_url text);
create table public.pr_rollermap_contacts(id uuid primary key references public.pr_rollermap_locations(id) on delete cascade,email text);
alter table public.pr_rollermap_locations enable row level security;
alter table public.pr_rollermap_contacts enable row level security;
revoke all on public.pr_rollermap_locations,public.pr_rollermap_contacts from anon,authenticated;
grant select on public.pr_rollermap_locations to anon,authenticated;
grant insert,update,delete on public.pr_rollermap_locations to authenticated;
grant select,insert,update,delete on public.pr_rollermap_contacts to authenticated;
create policy rollermap_public_read on public.pr_rollermap_locations for select to anon using(status='approved');
create policy rollermap_member_read on public.pr_rollermap_locations for select to authenticated using(status='approved' or public.soy_admin());
create policy rollermap_admin_insert on public.pr_rollermap_locations for insert to authenticated with check(public.soy_admin());
create policy rollermap_admin_update on public.pr_rollermap_locations for update to authenticated using(public.soy_admin()) with check(public.soy_admin());
create policy rollermap_admin_delete on public.pr_rollermap_locations for delete to authenticated using(public.soy_admin());
create policy rollermap_contacts_admin on public.pr_rollermap_contacts for all to authenticated using(public.soy_admin()) with check(public.soy_admin());
create schema if not exists rollermap_private;
revoke all on schema rollermap_private from public;
grant usage on schema rollermap_private to anon,authenticated;
create function rollermap_private.submit_location(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare new_id uuid;
begin
 if length(trim(coalesce(payload->>'name',''))) not between 1 and 200 or length(trim(coalesce(payload->>'city',''))) not between 1 and 200 or length(coalesce(payload->>'email','')) not between 3 and 254 then raise exception 'Nombre, ciudad y email obligatorios';end if;
 insert into public.pr_rollermap_locations(name,type,description,city,department,address,lat,lng,instagram,whatsapp,schedule)
 values(trim(payload->>'name'),payload->>'type',payload->>'description',trim(payload->>'city'),payload->>'department',payload->>'address',(payload->>'lat')::float8,(payload->>'lng')::float8,payload->>'instagram',payload->>'whatsapp',payload->>'schedule') returning id into new_id;
 insert into public.pr_rollermap_contacts(id,email) values(new_id,payload->>'email');return new_id;
end;$$;
revoke all on function rollermap_private.submit_location(jsonb) from public;
grant execute on function rollermap_private.submit_location(jsonb) to anon,authenticated;
create function public.pr_rollermap_submit_location(payload jsonb) returns uuid language sql security invoker set search_path='' as $$select rollermap_private.submit_location(payload)$$;
revoke all on function public.pr_rollermap_submit_location(jsonb) from public;
grant execute on function public.pr_rollermap_submit_location(jsonb) to anon,authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('pr-rollermap-images','pr-rollermap-images',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy rollermap_images_admin on storage.objects for all to authenticated using(bucket_id='pr-rollermap-images' and public.soy_admin()) with check(bucket_id='pr-rollermap-images' and public.soy_admin());
create index pr_rollermap_status_name on public.pr_rollermap_locations(status,name);

