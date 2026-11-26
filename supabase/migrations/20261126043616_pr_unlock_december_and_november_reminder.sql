insert into public.pr_unlock_campaigns(slug,title,starts_on,ends_on,active,prize_1_title,prize_1_detail,prize_1_target_km,prize_1_image_url,prize_2_title,prize_2_detail,prize_2_target_km,prize_2_image_url,prize_3_title,prize_3_detail,prize_3_target_km,prize_3_image_url) values('pr-unlock-diciembre-2026','PR Unlock · Diciembre 2026','2026-12-01','2026-12-31',true,'Caja de bombones','Una caja de bombones para la persona ganadora.',400,'/premios/Ferrerorocher.png','50% de descuento en Punta Rollers','Válido únicamente para una mensualidad: la próxima mensualidad de Punta Rollers. No acumulable.',750,'/premios/descuento-50.svg','Botella de vino','Una botella de vino para la persona ganadora mayor de edad.',1200,'/premios/Vino.png') on conflict(slug) do nothing;
alter policy pr_unlock_campaigns_public_read on public.pr_unlock_campaigns using(slug<>'pr-unlock-diciembre-2026' and (active=true or slug='pr-unlock-noviembre-2026'));
create or replace function public.pr_unlock_december_public() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare c public.pr_unlock_campaigns%rowtype; total numeric; out_json jsonb; n int;
begin
 if (now() at time zone 'America/Montevideo')::date<'2026-12-01'::date then return null;end if;
 select * into c from public.pr_unlock_campaigns where slug='pr-unlock-diciembre-2026' and active;
 if not found then return null;end if;
 select coalesce(sum(km),0) into total from public.pr_get_inline_ranking(c.starts_on,c.ends_on);
 out_json:=to_jsonb(c);
 for n in 1..3 loop
 if total < (out_json->>('prize_'||n||'_target_km'))::numeric then
 out_json:=out_json-('prize_'||n||'_title')-('prize_'||n||'_detail')-('prize_'||n||'_image_url');
 end if;
 end loop;
 return out_json;
end $$;
revoke all on function public.pr_unlock_december_public() from public;
grant execute on function public.pr_unlock_december_public() to anon,authenticated;
create or replace function public.pr_november_reminder_status() returns jsonb language sql stable security definer set search_path='' as $$
select jsonb_build_object('feedback_pending',not exists(select 1 from public.pr_voice_feedback where profile_id=public.pr_current_profile_id()),'nomination_open',coalesce((select nomination_open from public.pr_awards_public_status()),false)) where public.community_is_active_member(public.pr_current_profile_id())
$$;
revoke all on function public.pr_november_reminder_status() from public,anon;
grant execute on function public.pr_november_reminder_status() to authenticated;