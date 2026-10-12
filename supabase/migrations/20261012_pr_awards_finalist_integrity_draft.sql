-- PR Awards: finalists integrity and voting consistency (review before applying).
-- Prevent duplicate finalist identities and category mismatches in winners.
create or replace function public.pr_awards_validate_winner()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
 if not exists(
  select 1 from public.pr_awards_finalists f
  where f.id=new.finalist_id and f.category_id=new.category_id
 ) then
  raise exception 'Winner finalist does not belong to this category';
 end if;
 return new;
end $$;
drop trigger if exists pr_awards_validate_winner_trg on public.pr_awards_winners;
create trigger pr_awards_validate_winner_trg
before insert or update on public.pr_awards_winners
for each row execute function public.pr_awards_validate_winner();
revoke all on function public.pr_awards_validate_winner() from public,anon,authenticated;
-- Prevent a vote from being silently reassigned by editing the finalist's category/candidate.
-- Finalist rows with existing votes must be immutable.
create or replace function public.pr_awards_lock_voted_finalist()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
 if exists(select 1 from public.pr_awards_votes where finalist_id=old.id)
 and (new.category_id is distinct from old.category_id
   or new.candidate_id is distinct from old.candidate_id
   or new.finalist_position is distinct from old.finalist_position)
 then raise exception 'Finalist has votes and cannot be reassigned'; end if;
 return new;
end $$;
drop trigger if exists pr_awards_lock_voted_finalist_trg on public.pr_awards_finalists;
create trigger pr_awards_lock_voted_finalist_trg
before update on public.pr_awards_finalists
for each row execute function public.pr_awards_lock_voted_finalist();
revoke all on function public.pr_awards_lock_voted_finalist() from public,anon,authenticated;
