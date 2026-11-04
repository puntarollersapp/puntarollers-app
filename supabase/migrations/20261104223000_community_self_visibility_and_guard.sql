-- Production hotfix backfill: author can see their own posts and legacy audience cannot be escalated directly.
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
 where p.deleted_at is null and (p.visibility='members' or p.author_id=pid or public.community_are_friends(pid,p.author_id))
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
 and (visibility='members' or author_id=public.pr_current_profile_id() or public.community_are_friends(public.pr_current_profile_id(),author_id)));

-- SECURITY DEFINER interactions must independently authorize access.
create or replace function public.community_add_comment(p_post_id uuid,p_body text)
returns uuid language plpgsql security definer set search_path=public
as $$
declare pid text:=public.pr_current_profile_id(); cid uuid;
begin
 if not public.community_is_active_member(pid) then raise exception 'Perfil PR no habilitado'; end if;
 if coalesce(trim(p_body),'')='' then raise exception 'Comentario vacío'; end if;
 if not exists(select 1 from public.community_posts p where p.id=p_post_id and p.deleted_at is null and (p.visibility='members' or p.author_id=pid or public.community_are_friends(pid,p.author_id))) then raise exception 'Publicación no disponible'; end if;
 insert into public.community_post_comments(post_id,profile_id,body) values(p_post_id,pid,trim(p_body)) returning id into cid;
 return cid;
end $$;
create or replace function public.community_toggle_reaction(p_post_id uuid,p_reaction text)
returns boolean language plpgsql security definer set search_path=public
as $$
declare pid text:=public.pr_current_profile_id(); old text;
begin
 if not public.community_is_active_member(pid) then raise exception 'Perfil PR no habilitado'; end if;
 if not exists(select 1 from public.community_posts p where p.id=p_post_id and p.deleted_at is null and (p.visibility='members' or p.author_id=pid or public.community_are_friends(pid,p.author_id))) then raise exception 'Publicación no disponible'; end if;
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
 if not exists(select 1 from public.community_posts p where p.id=p_post_id and p.deleted_at is null and (p.visibility='members' or p.author_id=pid or public.community_are_friends(pid,p.author_id))) then raise exception 'Publicación no disponible'; end if;
 if exists(select 1 from public.community_reposts where post_id=p_post_id and profile_id=pid) then
 delete from public.community_reposts where post_id=p_post_id and profile_id=pid; return false; end if;
 insert into public.community_reposts(post_id,profile_id) values(p_post_id,pid); return true;
end $$;

create or replace function public.community_prevent_visibility_escalation() returns trigger language plpgsql set search_path=public as $guard$
begin
 if new.visibility is distinct from old.visibility and current_user in ('anon','authenticated') then
  raise exception 'El alcance de una publicación existente no se puede cambiar';
 end if;
 return new;
end $guard$;
drop trigger if exists community_prevent_visibility_escalation_trg on public.community_posts;
create trigger community_prevent_visibility_escalation_trg before update on public.community_posts for each row execute function public.community_prevent_visibility_escalation();
