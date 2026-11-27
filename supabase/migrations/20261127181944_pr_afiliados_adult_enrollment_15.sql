-- PR Afiliados: adult group enrollment only; initial payment, no referral credit or monthly campaign.
CREATE OR REPLACE FUNCTION public.validate_pr_referral_code(p_code text)
 RETURNS TABLE(profile_id text, display_name text, code text, discount_percent numeric)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with norm as (select regexp_replace(upper(trim(coalesce(p_code,''))), '\s+', '', 'g') as code)
  select 'campaign:afiliados'::text, 'PR Afiliados'::text, 'PRAFILIADOS'::text, 15::numeric
  from norm where norm.code='PRAFILIADOS'
  union all
  select p.id, trim(coalesce(p.nombre,'')||' '||coalesce(p.apellido,'')), c.code, 10::numeric
  from pr_referral_codes c join profiles p on p.id=c.profile_id cross join norm
  where c.active=true and regexp_replace(upper(trim(c.code)), '\s+', '', 'g')=norm.code
    and coalesce(p.estado,'Activo')='Activo' and norm.code not in ('ROLLERWEENPR','PRAFILIADOS')
  limit 1
$function$
;
CREATE OR REPLACE FUNCTION public.registrar_inscripcion_2026_v4(p_modalidad text, p_nombre_completo text, p_edad integer, p_localidad text, p_email text, p_telefono text, p_nivel text, p_turno_sabado text DEFAULT NULL::text, p_objetivo_personalizadas text DEFAULT NULL::text, p_nombre_responsable text DEFAULT NULL::text, p_quiere_remera boolean DEFAULT NULL::boolean, p_referral_code text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid; v_modalidad text:=trim(coalesce(p_modalidad,'')); v_nombre text:=trim(coalesce(p_nombre_completo,'')); v_email text:=lower(trim(coalesce(p_email,''))); v_tel text:=trim(coalesce(p_telefono,'')); v_nivel text:=trim(coalesce(p_nivel,'')); v_turno text:=nullif(trim(coalesce(p_turno_sabado,'')),''); v_objetivo text:=nullif(trim(coalesce(p_objetivo_personalizadas,'')),''); v_responsable text:=nullif(trim(coalesce(p_nombre_responsable,'')),''); v_personalizadas_abiertas boolean; v_base numeric; v_extra numeric:=0; v_original numeric; v_final numeric; v_ref_code text:=regexp_replace(upper(nullif(trim(coalesce(p_referral_code,'')),'')),'\s+','','g'); v_referrer text; v_scope text; v_campaign boolean:=false; v_affiliate boolean:=false; v_start_month date:=date_trunc('month',timezone('America/Montevideo',now()))::date;
begin
if v_modalidad not in ('grupales','personalizadas','kids') then raise exception 'Modalidad inválida'; end if; if v_nombre='' then raise exception 'Nombre requerido'; end if; if v_email='' or position('@' in v_email)<2 then raise exception 'Email inválido'; end if; if v_tel='' then raise exception 'WhatsApp requerido'; end if; if v_nivel='' or length(v_nivel)>50 then raise exception 'Nivel inválido'; end if;
if v_modalidad='kids' then if p_edad is null or p_edad<3 or p_edad>17 then raise exception 'Edad inválida para PR Kids'; end if; if v_responsable is null then raise exception 'Adulto responsable requerido'; end if; if v_turno is null then v_turno:='Sábado 19:00–20:00 · Pista cerrada Maldonado'; end if; v_objetivo:=null; v_base:=2000; v_extra:=case when coalesce(p_quiere_remera,false) then 690 else 0 end; v_scope:='10% en las primeras 2 mensualidades de PR Kids';
elsif v_modalidad='grupales' then if p_edad is null or p_edad<5 or p_edad>100 then raise exception 'Edad inválida'; end if; if nullif(trim(coalesce(p_localidad,'')),'') is null then raise exception 'Localidad requerida'; end if; if v_turno is null then raise exception 'Turno de sábado requerido'; end if; v_objetivo:=null; v_responsable:=null; v_base:=1700; v_scope:='10% en las primeras 2 mensualidades de Adultos';
else select personalizadas_abiertas into v_personalizadas_abiertas from public.pr_inscripciones_config where id='global'; if not coalesce(v_personalizadas_abiertas,true) then raise exception 'PERSONALIZADAS_CERRADAS'; end if; if p_edad is null or p_edad<5 or p_edad>100 then raise exception 'Edad inválida'; end if; if nullif(trim(coalesce(p_localidad,'')),'') is null then raise exception 'Localidad requerida'; end if; if v_objetivo is null then raise exception 'Objetivo requerido'; end if; v_turno:=null; v_responsable:=null; v_base:=3200; v_scope:='10% en la primera cuponera de Personalizadas'; end if;
if v_ref_code='ROLLERWEENPR' then raise exception 'CODIGO_AMIGOS_PR_INVALIDO'; end if; if v_ref_code='PRAFILIADOS' then if v_modalidad<>'grupales' then raise exception 'CODIGO_AMIGOS_PR_INVALIDO'; end if; v_affiliate:=true; v_scope:='15% en el pago inicial de Adultos · PR Afiliados'; elsif v_ref_code is not null then if v_ref_code='ROLLERWEENPR' then v_campaign:=true; if v_modalidad='personalizadas' then v_scope:='10% en la primera cuponera de Personalizadas · RollerWeen 2026'; else v_scope:='10% en las primeras 2 mensualidades · RollerWeen 2026'; end if; else select c.profile_id into v_referrer from public.pr_referral_codes c join public.profiles p on p.id=c.profile_id where c.active=true and regexp_replace(upper(trim(c.code)),'\s+','','g')=v_ref_code and coalesce(p.estado,'Activo')='Activo' limit 1; if v_referrer is null then raise exception 'CODIGO_AMIGOS_PR_INVALIDO'; end if; end if; end if;
v_original:=v_base+v_extra; v_final:=round((case when v_affiliate then v_base*.85 when v_referrer is not null or v_campaign then v_base*.90 else v_base end)+v_extra,0);
insert into public.pr_inscripciones_2026(modalidad,nombre_completo,edad,localidad,email,telefono,nivel,turno_sabado,objetivo_personalizadas,monto,metodo_pago,estado,comprobante_recibido,nombre_responsable,quiere_remera,referral_code,referral_profile_id,descuento_porcentaje,monto_original,monto_final) values(v_modalidad,v_nombre,p_edad,nullif(trim(coalesce(p_localidad,'')),''),v_email,v_tel,v_nivel,v_turno,v_objetivo,v_final,'Prex','pre_reserva',false,v_responsable,case when v_modalidad='kids' then coalesce(p_quiere_remera,false) else null end,v_ref_code,v_referrer,case when v_affiliate then 15 when v_referrer is not null or v_campaign then 10 else 0 end,v_original,v_final) returning id into v_id;
if v_campaign and v_modalidad in ('grupales','kids') then insert into public.pr_campaign_benefits(campaign_code,enrollment_id,email,modalidad,discount_percent,starts_month,months_total,active,base_amount) values('ROLLERWEENPR',v_id,v_email,v_modalidad,10,v_start_month,2,true,v_base) on conflict(enrollment_id) do nothing; end if;
if v_referrer is not null then insert into public.pr_referrals(referrer_profile_id,referral_code,referred_name,referred_email,referred_phone,enrollment_id,program,status,referred_discount_percent,referred_discount_scope,referrer_discount_percent,referrer_discount_months) values(v_referrer,v_ref_code,v_nombre,v_email,v_tel,v_id,case v_modalidad when 'grupales' then 'adultos' else v_modalidad end,'pendiente',10,v_scope,10,2) on conflict(enrollment_id) where enrollment_id is not null do nothing; end if;
return jsonb_build_object('id',v_id,'ok',true,'modalidad',v_modalidad,'monto',v_final,'monto_original',v_original,'descuento_porcentaje',case when v_affiliate then 15 when v_referrer is not null or v_campaign then 10 else 0 end,'referral_applied',v_referrer is not null,'campaign_applied',v_campaign or v_affiliate,'referral_code',case when v_campaign then 'ROLLERWEENPR' else v_ref_code end,'discount_scope',v_scope); end $function$
;
