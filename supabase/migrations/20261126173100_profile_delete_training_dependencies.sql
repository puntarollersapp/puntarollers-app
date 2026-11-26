-- Remove the exact obsolete student-training dependency blocking the existing authorized hard-delete flow.
-- Preserve external card membership history by detaching its nullable link, rather than deleting card records.
alter table public.pr_training_v2_progression drop constraint pr_training_v2_progression_profile_id_fkey,
 add constraint pr_training_v2_progression_profile_id_fkey foreign key(profile_id) references public.profiles(id) on delete cascade;
alter table public.pr_training_v2_exclusions drop constraint pr_training_v2_exclusions_profile_id_fkey,
 add constraint pr_training_v2_exclusions_profile_id_fkey foreign key(profile_id) references public.profiles(id) on delete cascade;
alter table public.pr_training_v2_technique_enables drop constraint pr_training_v2_technique_enables_profile_id_fkey,
 add constraint pr_training_v2_technique_enables_profile_id_fkey foreign key(profile_id) references public.profiles(id) on delete cascade;
alter table public.prcard_membership_links drop constraint prcard_membership_links_profile_id_fkey,
 add constraint prcard_membership_links_profile_id_fkey foreign key(profile_id) references public.profiles(id) on delete set null;
