-- Widen the initial four-frame constraint to permit earned 100 KM and future administrator-created frames.
alter table public.pr_frame_unlocks drop constraint if exists pr_frame_unlocks_frame_id_check;
alter table public.pr_frame_unlocks add constraint pr_frame_unlocks_frame_id_not_blank
check (length(btrim(frame_id)) between 1 and 80);
