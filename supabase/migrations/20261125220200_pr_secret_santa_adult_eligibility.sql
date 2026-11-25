create function pr_santa_private.has_adult_birthdate(p_dob text) returns boolean language sql immutable set search_path='' as $$
 select coalesce(p_dob ~ '^\d{4}-\d{2}-\d{2}$' and p_dob <= '2008-12-01',false)
$$;
create function pr_santa_private.is_eligible(p_id text,p_role text,p_dob text) returns boolean language plpgsql security definer set search_path='' as $$
declare kid boolean:=false;
begin
 if p_role not in ('alumno','profesor','admin') then return false; end if;
 if p_role='alumno' and p_dob ~ '^\d{4}-\d{2}-\d{2}$' and p_dob>'2008-12-01' then return false; end if;
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='pr_kids_children' and column_name='treasury_profile_id') then
  execute 'select exists(select 1 from public.pr_kids_children where treasury_profile_id=$1)' into kid using p_id;
 end if;
 return not kid;
end $$;
revoke all on function pr_santa_private.has_adult_birthdate(text),pr_santa_private.is_eligible(text,text,text) from public,anon,authenticated;
create or replace function pr_santa_private.dispatch(p_action text,p_payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare e pr_santa_private.event%rowtype; me record; mine pr_santa_private.letter%rowtype; a pr_santa_private.assignment%rowtype; result jsonb; visible boolean; phase text; likes text; avoid text; note text; opt boolean; budget integer;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 select id,role,acceso_habilitado,fecha_nacimiento into me from public.profiles where auth_user_id=auth.uid();
 if not found or me.role not in ('alumno','admin','profesor') or (me.role='alumno' and me.acceso_habilitado is distinct from true) then raise exception 'Not eligible' using errcode='42501'; end if;
 if not pr_santa_private.is_eligible(me.id,me.role,me.fecha_nacimiento) then raise exception 'Adult event only' using errcode='42501'; end if;
 select * into e from pr_santa_private.event where id=2026 for update;
 if p_action='configure' then
  if me.role<>'admin' then raise exception 'Admin required' using errcode='42501'; end if;
  budget:=nullif(p_payload->>'budget_uyu','')::integer;
  if budget is not null and (budget<1 or budget>100000) then raise exception 'Invalid budget'; end if;
  update pr_santa_private.event set place=left(nullif(btrim(p_payload->>'place'),''),250),budget_uyu=budget where id=2026;
 elsif p_action='save' then
  if now()<e.opens_at or now()>=e.reveal_at or e.drawn_at is not null then raise exception 'Registration closed'; end if;
  opt:=(p_payload->>'participating')::boolean;
  if opt is null then raise exception 'Response required'; end if;
  if opt and me.role='alumno' and not pr_santa_private.has_adult_birthdate(me.fecha_nacimiento) and coalesce((p_payload->>'adult_confirmed')::boolean,false) is not true then raise exception 'Adult confirmation required'; end if;
  likes:=case when opt then btrim(coalesce(p_payload->>'likes','')) else '' end;
  avoid:=case when opt then btrim(coalesce(p_payload->>'avoid','')) else '' end;
  note:=case when opt then btrim(coalesce(p_payload->>'note','')) else '' end;
  insert into pr_santa_private.letter(event_id,profile_id,participating,likes,avoid,note)
  values(2026,me.id,opt,likes,avoid,note)
  on conflict(event_id,profile_id) do update set participating=excluded.participating,likes=excluded.likes,avoid=excluded.avoid,note=excluded.note,updated_at=now();
 elsif p_action not in ('state','reveal','ready') then raise exception 'Invalid action'; end if;
 -- Draw exactly once when the first eligible request reaches the deadline.
 perform pr_santa_private.draw_due();
 select * into e from pr_santa_private.event where id=2026;
 select * into mine from pr_santa_private.letter where event_id=2026 and profile_id=me.id;
 select * into a from pr_santa_private.assignment where event_id=2026 and giver=me.id;
 if p_action in ('reveal','ready') then
  if e.drawn_at is null or a.giver is null then raise exception 'No assignment'; end if;
  if p_action='reveal' then
   update pr_santa_private.assignment set revealed_at=coalesce(revealed_at,now()) where event_id=2026 and giver=me.id;
   select jsonb_build_object('name',concat_ws(' ',p.nombre,p.apellido),'photo',p.foto,'likes',l.likes,'avoid',l.avoid,'note',l.note) into result from pr_santa_private.letter l left join public.profiles p on p.id=l.profile_id where l.event_id=2026 and l.profile_id=a.recipient;
   return result;
  else
   update pr_santa_private.assignment set ready_at=coalesce(ready_at,now()) where event_id=2026 and giver=me.id;
   a.ready_at:=now();
  end if;
 end if;
 visible:=now()>=e.opens_at and now()<'2027-01-01 00:00:00-03'::timestamptz;
 phase:=case when now()<e.opens_at then 'scheduled' when now()>=e.delivery_at then 'finished' when e.drawn_at is not null then 'drawn' when now()>=e.reveal_at then 'closed' else 'open' end;
 return jsonb_build_object('event',jsonb_build_object('visible',visible,'status',phase,'opens_at',e.opens_at,'reveal_at',e.reveal_at,'delivery_at',e.delivery_at,'place',e.place,'budget_uyu',e.budget_uyu),
 'mine',jsonb_build_object('participating',mine.participating,'likes',mine.likes,'avoid',mine.avoid,'note',mine.note,'ready',a.ready_at is not null,'revealed',a.revealed_at is not null),
 'stats',jsonb_build_object('participants',(select count(*) from pr_santa_private.letter where event_id=2026 and participating),'letters',(select count(*) from pr_santa_private.letter where event_id=2026 and participating),'ready',(select count(*) from pr_santa_private.assignment where event_id=2026 and ready_at is not null)),
 'adult_confirmation_required',me.role='alumno' and not pr_santa_private.has_adult_birthdate(me.fecha_nacimiento),
 'admin',case when me.role='admin' then jsonb_build_object('declined',(select count(*) from pr_santa_private.letter where event_id=2026 and not participating),'revealed',(select count(*) from pr_santa_private.assignment where event_id=2026 and revealed_at is not null),'drawn',e.drawn_at is not null) else null end);
end $$;

create function public.pr_santa_save_letter(p_participating boolean,p_likes text,p_avoid text,p_note text,p_adult_confirmed boolean) returns jsonb language sql security invoker set search_path='' as $$
select pr_santa_private.dispatch('save',jsonb_build_object('participating',p_participating,'likes',p_likes,'avoid',p_avoid,'note',p_note,'adult_confirmed',p_adult_confirmed))$$;
revoke all on function public.pr_santa_save_letter(boolean,text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.pr_santa_save_letter(boolean,text,text,text,boolean) to authenticated;
