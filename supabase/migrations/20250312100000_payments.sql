-- Payments table: one row per Stripe Checkout session (coin bundle purchase).
-- Used for idempotent webhook handling and audit.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  bundle_id text not null,
  coins int not null,
  amount_cents int not null,
  stripe_session_id text not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_stripe_session_id_unique unique (stripe_session_id)
);

create index payments_user_id_created_at on public.payments (user_id, created_at desc);
create index payments_stripe_session_id on public.payments (stripe_session_id);

create trigger payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- RLS: users can read only their own payments; insert/update from Edge Functions via service role.
alter table public.payments enable row level security;

create policy "Users can read own payments"
  on public.payments for select
  using (auth.uid() = user_id);
