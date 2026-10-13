-- Prevent duplicate uniform orders when a buyer retries a request.
alter table public.pr_uniform_orders add column if not exists request_key uuid;
create unique index if not exists pr_uniform_orders_request_key_idx on public.pr_uniform_orders(request_key) where request_key is not null;
