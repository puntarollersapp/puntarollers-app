-- PR Secret Santa 2026. Private storage; authenticated RPCs only.
create schema if not exists pr_santa_private;
revoke all on schema pr_santa_private from public,anon,authenticated;
grant usage on schema pr_santa_private to authenticated;
create table pr_santa_private.event (
 id integer primary key check(id=2026),
 opens_at timestamptz not null, reveal_at timestamptz not null, delivery_at timestamptz not null,
 place text, budget_uyu integer check(budget_uyu>0), drawn_at timestamptz,
 check(opens_at<reveal_at and reveal_at<delivery_at)
);
insert into pr_santa_private.event(id,opens_at,reveal_at,delivery_at,place)
values(2026,'2026-12-01 00:00:00-03','2026-12-08 00:00:00-03','2026-12-16 19:30:00-03','Punta del Este · Clase especial (punto de encuentro por confirmar)');
create table pr_santa_private.letter (
 event_id integer not null references pr_santa_private.event(id),
 profile_id text not null, participating boolean not null,
 likes text not null default '',avoid text not null default '',note text not null default '',
 updated_at timestamptz not null default now(),
 primary key(event_id,profile_id),
 check(length(likes)<=500 and length(avoid)<=500 and length(note)<=500),
 check(not participating or length(btrim(likes))>0)
);
create table pr_santa_private.assignment (
 event_id integer not null,
 giver text not null, recipient text not null,
 revealed_at timestamptz, ready_at timestamptz,
 primary key(event_id,giver), unique(event_id,recipient), check(giver<>recipient),
 foreign key(event_id,giver) references pr_santa_private.letter(event_id,profile_id),
 foreign key(event_id,recipient) references pr_santa_private.letter(event_id,profile_id)
);
alter table pr_santa_private.event enable row level security;
alter table pr_santa_private.letter enable row level security;
alter table pr_santa_private.assignment enable row level security;
revoke all on all tables in schema pr_santa_private from public,anon,authenticated;
-- One transaction, lock event before drawing or saving. Random cycle ensures no self or duplicates.
create function pr_santa_private.draw_due() returns void language plpgsql security definer set search_path='' as $$
declare e pr_santa_private.event%rowtype; ids text[]; n integer; i integer;
begin
 select * into e from pr_santa_private.event where id=2026 for update;
 if e.drawn_at is not null or now()<e.reveal_at or now()>=e.delivery_at then return; end if;
 select array_agg(profile_id order by random()) into ids from pr_santa_private.letter where event_id=2026 and participating;
 n:=coalesce(cardinality(ids),0);
 if n<2 then return; end if;
 for i in 1..n loop
 insert into pr_santa_private.assignment(event_id,giver,recipient) values(2026,ids[i],ids[(i%n)+1]);
 end loop;
 update pr_santa_private.event set drawn_at=now() where id=2026;
end $$;
revoke all on function pr_santa_private.draw_due() from public,anon,authenticated;
create function pr_santa_private.dispatch(p_action text,p_payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare e pr_santa_private.event%rowtype; me record; mine pr_santa_private.letter%rowtype; a pr_santa_private.assignment%rowtype; result jsonb; visible boolean; phase text; likes text; avoid text; note text; opt boolean; budget integer;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 select id,role,acceso_habilitado into me from public.profiles where auth_user_id=auth.uid();
 if not found or me.role not in ('alumno','admin','profesor') or (me.role='alumno' and me.acceso_habilitado is distinct from true) then raise exception 'Not eligible' using errcode='42501'; end if;
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
 'admin',case when me.role='admin' then jsonb_build_object('declined',(select count(*) from pr_santa_private.letter where event_id=2026 and not participating),'revealed',(select count(*) from pr_santa_private.assignment where event_id=2026 and revealed_at is not null),'drawn',e.drawn_at is not null) else null end);
end $$;
revoke all on function pr_santa_private.dispatch(text,jsonb) from public,anon,authenticated;
grant execute on function pr_santa_private.dispatch(text,jsonb) to authenticated;
create function public.pr_santa_state() returns jsonb language sql security invoker set search_path='' as $$select pr_santa_private.dispatch('state')$$;
create function public.pr_santa_save_letter(p_participating boolean,p_likes text,p_avoid text,p_note text) returns jsonb language sql security invoker set search_path='' as $$select pr_santa_private.dispatch('save',jsonb_build_object('participating',p_participating,'likes',p_likes,'avoid',p_avoid,'note',p_note))$$;
create function public.pr_santa_reveal() returns jsonb language sql security invoker set search_path='' as $$select pr_santa_private.dispatch('reveal')$$;
create function public.pr_santa_ready() returns jsonb language sql security invoker set search_path='' as $$select pr_santa_private.dispatch('ready')$$;
create function public.pr_santa_configure(p_place text,p_budget_uyu integer) returns jsonb language sql security invoker set search_path='' as $$select pr_santa_private.dispatch('configure',jsonb_build_object('place',p_place,'budget_uyu',p_budget_uyu))$$;
revoke all on function public.pr_santa_state(),public.pr_santa_save_letter(boolean,text,text,text),public.pr_santa_reveal(),public.pr_santa_ready(),public.pr_santa_configure(text,integer) from public,anon,authenticated;
grant execute on function public.pr_santa_state(),public.pr_santa_save_letter(boolean,text,text,text),public.pr_santa_reveal(),public.pr_santa_ready(),public.pr_santa_configure(text,integer) to authenticated;
