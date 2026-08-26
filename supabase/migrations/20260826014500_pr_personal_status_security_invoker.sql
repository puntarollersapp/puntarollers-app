-- Keep the atomic transition under the signed-in admin's RLS context.
alter function public.pr_personal_cambiar_estado(bigint, text, text) security invoker;
