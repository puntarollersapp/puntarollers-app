-- Christmas 2026: universal gifts, visible to students from the existing release gate.
insert into public.pr_accessory_catalog(code,title,asset_file,unlock_description,unlock_rule,enabled,sort_order) values
('navidad-2026','Arbolito de Navidad','Navidad 2026.png','Regalo de Navidad 2026 para todos los alumnos','{"kind":"everyone","target":0}'::jsonb,true, -3),
('navidad-grinch','Grinch','Navidad grinch.png','Regalo de Navidad 2026 para todos los alumnos','{"kind":"everyone","target":0}'::jsonb,true, -2),
('navidad-jengibre','Muñeco de jengibre','Navidad jengibre.png','Regalo de Navidad 2026 para todos los alumnos','{"kind":"everyone","target":0}'::jsonb,true, -1)
on conflict(code) do nothing;
insert into public.pr_accessory_grants(profile_id,accessory_code,source)
select p.id,c.code,case when p.id='admin-claudio' then 'owner_preview' else 'launch_gift' end
from public.profiles p cross join public.pr_accessory_catalog c
where (p.role='alumno' or p.participa_como_alumno=true or p.id='admin-claudio')
and c.code in ('navidad-2026','navidad-grinch','navidad-jengibre')
on conflict(profile_id,accessory_code) do nothing;
