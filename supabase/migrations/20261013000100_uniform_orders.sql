-- Uniform purchases are isolated from student registrations and treasury.
create table if not exists public.pr_uniform_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  product_id uuid not null,
  product_name text not null,
  model text,
  color text,
  size text not null,
  quantity integer not null check (quantity between 1 and 20),
  unit_price numeric(12,2) not null check (unit_price > 0),
  total numeric(12,2) not null check (total > 0),
  buyer_name text not null,
  buyer_email text,
  buyer_phone text,
  notes text,
  payment_method text not null check (payment_method in ('transfer','mercadopago')),
  payment_status text not null default 'pending' check (payment_status in ('pending','approved','rejected','refunded')),
  provider_payment_id text unique,
  provider_preference_id text,
  paid_at timestamptz,
  constraint pr_uniform_orders_total_check check (total = unit_price * quantity)
);
create index if not exists pr_uniform_orders_created_idx on public.pr_uniform_orders (created_at desc);
create index if not exists pr_uniform_orders_status_idx on public.pr_uniform_orders (payment_status);
alter table public.pr_uniform_orders enable row level security;
-- Deliberately no anonymous INSERT/SELECT policies. Public orders must be
-- created by a server-side function that validates product, price and stock.
-- Payment status must only be updated after server-side provider verification.
revoke all on public.pr_uniform_orders from anon, authenticated;
