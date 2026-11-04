-- Member-wide community posts: staged, review before deploying.
-- Member access is independent of friendship and excludes paused or blocked profiles.
create or replace function public.community_is_active_member(p_profile_id text default public.pr_current_profile_id())
returns boolean language sql stable security definer set search_path=public
as $membercheck$
 select auth.uid() is not null
   and p_profile_id is not null
   and p_profile_id=public.pr_current_profile_id()
   and exists(select 1 from public.profiles p where p.id=p_profile_id
     and p.estado='Activo' and p.acceso_habilitado is true);
$membercheck$;
revoke all on function public.community_is_active_member(text) from public,anon;
grant execute on function public.community_is_active_member(text) to authenticated;

-- Legacy content remains friends-only. Member posts are text-only until private media delivery is available.
create or replace function public.community_create_member_post(p_body text)
returns uuid language plpgsql security definer set search_path = public
as $$
declare pid text := public.pr_current_profile_id(); postid uuid;
begin
  if not public.community_is_active_member(pid) then raise exception 'Necesitás un perfil PR activo y habilitado'; end if;
  if length(trim(coalesce(p_body,''))) < 1 then raise exception 'Escribí algo para publicar'; end if;
  if length(p_body) > 5000 then raise exception 'La publicación es demasiado larga'; end if;
  insert into public.community_posts(author_id,body,visibility)
  values(pid,trim(p_body),'members') returning id into postid;
  return postid;
end $$;
revoke all on function public.community_create_member_post(text) from public,anon;
grant execute on function public.community_create_member_post(text) to authenticated;

-- This feed runs as definer: authenticate BEFORE reading any profile or post.
create or replace function public.community_social_feed()
returns jsonb language plpgsql stable security definer set search_path = public
as $$
declare pid text := public.pr_current_profile_id(); result jsonb;
begin
 if not public.community_is_active_member(pid) then return '[]'::jsonb; end if;
 select coalesce(jsonb_agg(x.item order by x.created_at desc),'[]'::jsonb) into result
 from (
 select p.created_at,jsonb_build_object(
  'id',p.id,'author_id',p.author_id,'body',p.body,'created_at',p.created_at,
  'visibility',p.visibility,
  'author',jsonb_build_object('nombre',a.nombre,'apellido',a.apellido,'foto',a.foto),
  'media',(select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'url',m.media_path,'sort',m.sort_order) order by m.sort_order),'[]'::jsonb) from public.community_post_media m where m.post_id=p.id),
  'reactions',(select coalesce(jsonb_agg(jsonb_build_object('profile_id',r.profile_id,'reaction',r.reaction)),'[]'::jsonb) from public.community_post_reactions r where r.post_id=p.id),
  'comments',(select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'profile_id',c.profile_id,'body',c.body,'created_at',c.created_at,'nombre',cp.nombre) order by c.created_at),'[]'::jsonb) from public.community_post_comments c join public.profiles cp on cp.id=c.profile_id where c.post_id=p.id),
  'tags',(select coalesce(jsonb_agg(jsonb_build_object('profile_id',t.profile_id,'status',t.status,'nombre',tp.nombre)),'[]'::jsonb) from public.community_post_tags t join public.profiles tp on tp.id=t.profile_id where t.post_id=p.id),
  'reposted',exists(select 1 from public.community_reposts rr where rr.post_id=p.id and rr.profile_id=pid),
  'repost_count',(select count(*) from public.community_reposts rr where rr.post_id=p.id)
 ) item
 from public.community_posts p join public.profiles a on a.id=p.author_id
 where p.deleted_at is null and (p.visibility='members' or public.community_are_friends(pid,p.author_id))
 order by p.created_at desc limit 60
 ) x;
 return result;
end $$;
revoke all on function public.community_social_feed() from public,anon;
grant execute on function public.community_social_feed() to authenticated;

-- Align direct table access with the same audience boundary.
drop policy if exists p_posts_r on public.community_posts;
create policy p_posts_r on public.community_posts for select to authenticated
using (deleted_at is null and public.community_is_active_member(public.pr_current_profile_id())
 and (visibility='members' or public.community_are_friends(public.pr_current_profile_id(),author_id)));

-- SECURITY DEFINER interactions must independently authorize access.
create or replace function public.community_add_comment(p_post_id uuid,p_body text)
returns uuid language plpgsql security definer set search_path=public
as $$
declare pid text:=public.pr_current_profile_id(); cid uuid;
begin
 if not public.community_is_active_member(pid) then raise exception 'Perfil PR no habilitado'; end if;
 if coalesce(trim(p_body),'')='' then raise exception 'Comentario vacío'; end if;
 if not exists(select 1 from public.community_posts p where p.id=p_post_id and p.deleted_at is null and (p.visibility='members' or public.community_are_friends(pid,p.author_id))) then raise exception 'Publicación no disponible'; end if;
 insert into public.community_post_comments(post_id,profile_id,body) values(p_post_id,pid,trim(p_body)) returning id into cid;
 return cid;
end $$;
create or replace function public.community_toggle_reaction(p_post_id uuid,p_reaction text)
returns boolean language plpgsql security definer set search_path=public
as $$
declare pid text:=public.pr_current_profile_id(); old text;
begin
 if not public.community_is_active_member(pid) then raise exception 'Perfil PR no habilitado'; end if;
 if not exists(select 1 from public.community_posts p where p.id=p_post_id and p.deleted_at is null and (p.visibility='members' or public.community_are_friends(pid,p.author_id))) then raise exception 'Publicación no disponible'; end if;
 select reaction into old from public.community_post_reactions where post_id=p_post_id and profile_id=pid;
 if old=p_reaction then delete from public.community_post_reactions where post_id=p_post_id and profile_id=pid; return false; end if;
 insert into public.community_post_reactions(post_id,profile_id,reaction) values(p_post_id,pid,p_reaction)
 on conflict(post_id,profile_id) do update set reaction=excluded.reaction,created_at=now();
 return true;
end $$;
create or replace function public.community_toggle_repost(p_post_id uuid)
returns boolean language plpgsql security definer set search_path=public
as $$
declare pid text:=public.pr_current_profile_id();
begin
 if not public.community_is_active_member(pid) then raise exception 'Perfil PR no habilitado'; end if;
 if not exists(select 1 from public.community_posts p where p.id=p_post_id and p.deleted_at is null and (p.visibility='members' or public.community_are_friends(pid,p.author_id))) then raise exception 'Publicación no disponible'; end if;
 if exists(select 1 from public.community_reposts where post_id=p_post_id and profile_id=pid) then
 delete from public.community_reposts where post_id=p_post_id and profile_id=pid; return false; end if;
 insert into public.community_reposts(post_id,profile_id) values(p_post_id,pid); return true;
end $$;
