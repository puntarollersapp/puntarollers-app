
create or replace function public.pr_dm_storage_access(p_name text,p_write boolean default false)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare me text:=public.pr_current_profile_id(); cid text:=split_part(p_name,'/',1);
begin
 if not public.community_is_active_member(me) or p_name !~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]+$' then return false; end if;
 return exists(select 1 from public.pr_dm_conversations c where c.id::text=cid and me in(c.profile_a_id,c.profile_b_id) and public.pr_dm_are_friends(c.profile_a_id,c.profile_b_id) and
 case when p_write then coalesce((select cp.allow_messages_from_friends from public.community_privacy cp where cp.profile_id=case when c.profile_a_id=me then c.profile_b_id else c.profile_a_id end),true)
 else exists(select 1 from public.pr_dm_messages m where m.conversation_id=c.id and split_part(m.media_url,'/storage/v1/object/public/pr-chat-media/',2)=p_name and not exists(select 1 from public.pr_dm_message_hides h where h.message_id=m.id and h.profile_id=me)) end);
end $$;
revoke all on function public.pr_dm_storage_access(text,boolean) from public,anon;
grant execute on function public.pr_dm_storage_access(text,boolean) to authenticated;
drop policy if exists pr_chat_media_insert on storage.objects;
drop policy if exists pr_chat_media_update on storage.objects;
create policy pr_chat_media_insert on storage.objects for insert to authenticated with check(bucket_id='pr-chat-media' and public.pr_dm_storage_access(name,true) and owner_id=auth.uid()::text);
create policy pr_chat_media_read_members on storage.objects for select to authenticated using(bucket_id='pr-chat-media' and public.pr_dm_storage_access(name,false));
create or replace function public.pr_dm_send_media(conversation_id_value uuid, media_type_value text, media_url_value text, media_name_value text default null, body_value text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare me text:=public.pr_current_profile_id(); clean text:=nullif(btrim(coalesce(body_value,'')),''); path text; mim text;
begin
 if not public.community_is_active_member(me) or media_type_value not in ('image','audio') or media_url_value is null then return jsonb_build_object('success',false,'error','Archivo inválido.');end if;
 path:=split_part(media_url_value,'/storage/v1/object/public/pr-chat-media/',2);
 if split_part(path,'/',1)<>conversation_id_value::text or not public.pr_dm_storage_access(path,true) then return jsonb_build_object('success',false,'error','Archivo o conversación no autorizados.');end if;
 select o.metadata->>'mimetype' into mim from storage.objects o where o.bucket_id='pr-chat-media' and o.name=path and o.owner_id=auth.uid()::text;
 if not found or (media_type_value='image' and coalesce(mim,'') not in ('image/jpeg','image/png','image/webp','image/gif')) or (media_type_value='audio' and coalesce(mim,'') not in ('audio/webm','audio/ogg','audio/mpeg','audio/mp4','audio/wav')) then return jsonb_build_object('success',false,'error','Archivo no autorizado o formato inválido.');end if;
 if char_length(coalesce(clean,''))>1200 then return jsonb_build_object('success',false,'error','Mensaje demasiado largo.');end if;
 insert into public.pr_dm_messages(conversation_id,sender_profile_id,body,media_type,media_url,media_name) values(conversation_id_value,me,clean,media_type_value,'https://ycgxnzeaihuwlwfwalom.supabase.co/storage/v1/object/public/pr-chat-media/'||path,left(media_name_value,240));
 update public.pr_dm_conversations set updated_at=now() where id=conversation_id_value;
 return jsonb_build_object('success',true);
end $$;
revoke all on function public.pr_dm_send_media(uuid,text,text,text,text) from public,anon;
grant execute on function public.pr_dm_send_media(uuid,text,text,text,text) to authenticated;
