create table if not exists public.pr_mercadopago_payments (
  id uuid primary key default gen_random_uuid(),
  registration_type text not null
    check (registration_type in ('inscripciones_2026', 'clinica_oct_2026')),
  registration_id uuid not null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'UYU' check (currency = 'UYU'),
  environment text not null default 'test' check (environment in ('test', 'production')),
  idempotency_key text not null unique,
  external_reference text not null unique,
  provider_order_id text unique,
  provider_payment_id text,
  payment_state text not null default 'created'
    check (payment_state in ('created', 'pending', 'paid', 'failed', 'cancelled', 'review')),
  provider_status text,
  provider_status_detail text,
  payment_method_id text,
  payment_type text,
  installments integer check (installments is null or installments between 1 and 24),
  failure_code text,
  paid_at timestamptz,
  webhook_received_at timestamptz,
  payment_notification_claimed_at timestamptz,
  payment_notification_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.pr_mercadopago_payments is
  'Mercado Pago payment attempts linked to registrations. Never stores card tokens, credentials, or full provider payloads.';

create index if not exists pr_mp_payments_registration_idx
  on public.pr_mercadopago_payments (registration_type, registration_id, created_at desc);

create index if not exists pr_mp_payments_provider_payment_idx
  on public.pr_mercadopago_payments (provider_payment_id)
  where provider_payment_id is not null;

create unique index if not exists pr_mp_payments_one_open_attempt_idx
  on public.pr_mercadopago_payments (registration_type, registration_id)
  where payment_state in ('created', 'pending', 'paid', 'review');

alter table public.pr_mercadopago_payments enable row level security;

revoke all on table public.pr_mercadopago_payments from anon;
revoke all on table public.pr_mercadopago_payments from authenticated;
grant select on table public.pr_mercadopago_payments to authenticated;

drop policy if exists "Admins can view Mercado Pago attempts" on public.pr_mercadopago_payments;
create policy "Admins can view Mercado Pago attempts"
  on public.pr_mercadopago_payments
  for select
  to authenticated
  using (public.soy_admin());

create or replace function public.claim_pr_mp_payment_notification(p_attempt_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rows integer;
begin
  update public.pr_mercadopago_payments
  set payment_notification_claimed_at = now(),
      updated_at = now()
  where id = p_attempt_id
    and payment_state = 'paid'
    and payment_notification_sent_at is null
    and (
      payment_notification_claimed_at is null
      or payment_notification_claimed_at < now() - interval '10 minutes'
    );

  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

revoke all on function public.claim_pr_mp_payment_notification(uuid) from public;
revoke all on function public.claim_pr_mp_payment_notification(uuid) from anon;
revoke all on function public.claim_pr_mp_payment_notification(uuid) from authenticated;
grant execute on function public.claim_pr_mp_payment_notification(uuid) to service_role;
