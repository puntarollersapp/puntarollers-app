-- New standalone collectibles schema. No changes to PATCH, badges, or existing grants.
create table public.pr_collectibles_catalog (
 code text primary key, card_number integer not null unique check(card_number>0),
 title text not null, rarity text not null check(rarity in ('common','holo','epic','legendary','limited')),
 main_collection boolean not null, grant_enabled boolean not null default false
);
create table public.pr_collectibles_grants (
 profile_id text not null references public.profiles(id),
 card_code text not null references public.pr_collectibles_catalog(code),
 granted_at timestamptz not null default now(),
 granted_by text not null references public.profiles(id),
 reason text not null check(length(trim(reason)) between 1 and 500),
 primary key(profile_id,card_code)
);
alter table public.pr_collectibles_catalog enable row level security;
alter table public.pr_collectibles_grants enable row level security;
revoke all on public.pr_collectibles_catalog,public.pr_collectibles_grants from anon,authenticated;
grant select on public.pr_collectibles_catalog to authenticated;
grant select,insert on public.pr_collectibles_grants to authenticated;
create policy pr_collectibles_catalog_read on public.pr_collectibles_catalog for select to authenticated using (public.pr_frames_is_admin() or now()>='2026-12-01 00:00:00-03'::timestamptz);
create policy pr_collectibles_grants_read on public.pr_collectibles_grants for select to authenticated using (public.pr_frames_is_admin() or (profile_id=public.pr_current_profile_id() and now()>='2026-12-01 00:00:00-03'::timestamptz));
create policy pr_collectibles_grants_insert on public.pr_collectibles_grants for insert to authenticated with check (
 public.pr_frames_is_admin() and granted_by=public.pr_current_profile_id()
 and exists(select 1 from public.pr_collectibles_catalog c where c.code=card_code and c.grant_enabled)
 and exists(select 1 from public.profiles p where p.id=profile_id and (p.role='alumno' or p.participa_como_alumno=true))
);
insert into public.pr_collectibles_catalog(code,card_number,title,rarity,main_collection,grant_enabled) values
('PR-001',1,'Mi primera clase','common',true,true),
('PR-002',2,'Primera clase al aire libre','common',true,true),
('PR-003',3,'Primera clase en pista','common',true,true),
('PR-004',4,'Actitud positiva','common',true,true),
('PR-005',5,'Buen compañero','common',true,true),
('PR-006',6,'Freno con taco','common',true,true),
('PR-007',7,'Freno en T','common',true,true),
('PR-008',8,'Mi primer evento PR','common',true,true),
('PR-009',9,'Primeros 3K','common',true,true),
('PR-010',10,'Primeros 6K','common',true,true),
('PR-011',11,'Mi primer deber','common',true,true),
('PR-012',12,'5 asistencias','common',true,true),
('PR-013',13,'Primeros 10K','holo',true,true),
('PR-014',14,'Rodador frecuente','holo',true,true),
('PR-015',15,'Espíritu PR','holo',true,true),
('PR-016',16,'10 asistencias','holo',true,true),
('PR-017',17,'20 asistencias','holo',true,true),
('PR-018',18,'50 KM acumulados','holo',true,true),
('PR-019',19,'100 KM acumulados','holo',true,true),
('PR-020',20,'250 KM acumulados','holo',true,true),
('PR-021',21,'4 semanas de constancia','holo',true,true),
('PR-022',22,'Mes perfecto de deberes','holo',true,true),
('PR-023',23,'Primera salida grupal','holo',true,true),
('PR-024',24,'Mi primera clínica','holo',true,true),
('PR-025',25,'Entrenador potencial','epic',true,true),
('PR-026',26,'25 asistencias','epic',true,true),
('PR-027',27,'50 asistencias','epic',true,true),
('PR-028',28,'500 KM acumulados','epic',true,true),
('PR-029',29,'20 KM en una salida','epic',true,true),
('PR-030',30,'3 clínicas','epic',true,true),
('PR-031',31,'3 meses de constancia','epic',true,true),
('PR-032',32,'3 meses de deberes completos','epic',true,true),
('PR-033',33,'5 salidas grupales','epic',true,true),
('PR-034',34,'10 eventos PR','epic',true,true),
('PR-035',35,'1000 KM acumulados','legendary',true,true),
('PR-036',36,'2000 KM acumulados','legendary',true,true),
('PR-037',37,'100 asistencias','legendary',true,true),
('PR-038',38,'200 asistencias','legendary',true,true),
('PR-039',39,'Un año de constancia','legendary',true,true),
('PR-040',40,'6 meses de deberes completos','legendary',true,true),
('PR-041',41,'Juntos por Valentino 2026','limited',false,true),
('PR-042',42,'Travesía La Barra 19K','limited',false,true),
('PR-043',43,'Shifter 2026','limited',false,true),
('PR-044',44,'10 años de Punta Rollers','limited',false,false),
('PR-045',45,'Navidad 2026','limited',false,false),
('PR-046',46,'Verano 2027','limited',false,false),
('PR-047',47,'Roller Night 2027','limited',false,false),
('PR-048',48,'Clínica especial 2027','limited',false,false),
('PR-049',49,'11 años de Punta Rollers','limited',false,false),
('PR-050',50,'Cierre de temporada 2027','limited',false,false);
