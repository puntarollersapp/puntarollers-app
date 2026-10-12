-- PR Awards seed, staging-only. Idempotent; do not overwrite admin edits.
-- Run only after the base schema migration has been reviewed and applied.
insert into public.pr_awards_categories(title,section,description,is_automatic,sort_order) values
('Leyenda del Asfalto','sport','Podio histórico de kilómetros válidos registrados en Punta Rollers. Clasificación automática.',true,10),
('Revelación del Año','sport','La evolución que más sorprendió a la comunidad.',false,20),
('Espíritu Imparable','sport','Nunca se rinde, siempre vuelve a intentarlo.',false,30),
('La Técnica Dorada','sport','Dominio, control y técnica sobre ruedas.',false,40),
('El Alma de PR','community','Ese compañero que siempre está para los demás.',false,50),
('Energía Infinita','community','La mejor actitud y la energía más contagiosa.',false,60),
('La Dupla del Año','community','Dos personas que parecen venir siempre en equipo.',false,70),
('Asistencia Perfecta','community','Quien nunca falta a una clase.',false,80),
('GPS Perdido','fun','La persona más distraída de Punta Rollers.',false,90),
('Micrófono de Oro','fun','Habla incluso cuando todo el mundo está patinando.',false,100),
('El Traspié del Año','fun','Un desequilibrio que pasó a la historia.',false,110),
('Gravedad 1 — Patinador 0','fun','La caída más recordada, siempre con respeto.',false,120),
('Siempre Cinco Minutitos','fun','El clásico que llega justo sobre la hora.',false,130),
('La Cuchara de Oro','fun','Quien conquista al grupo con sus comidas.',false,140),
('Mecha Corta','fun','Quien se enoja más rápido, con cariño.',false,150),
('DJ sobre Ruedas','fun','La persona que siempre tiene la música indicada.',false,160)
on conflict (title) do nothing;
-- NOTE: The Dupla category needs a pair-specific candidate model before opening.
-- No profiles are seeded here: names and consent must be verified against real people.
