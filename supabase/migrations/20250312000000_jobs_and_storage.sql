-- Jobs table: one row per conversion job (history).
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  format text not null check (format in ('csv', 'xlsx', 'qbo')),
  raw_key text not null,
  file_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  validation_errors jsonb default '[]',
  validation_warnings jsonb default '[]',
  account_count int default 0,
  transaction_count int default 0
);

create index jobs_user_id_created_at on public.jobs (user_id, created_at desc);

create trigger jobs_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

-- RLS: users can read only their own jobs; insert/update via service role or restricted.
alter table public.jobs enable row level security;

create policy "Users can read own jobs"
  on public.jobs for select
  using (auth.uid() = user_id);

create policy "Users can insert own jobs"
  on public.jobs for insert
  with check (auth.uid() = user_id);

-- Service role will update job status from Edge Functions; allow update for own row for polling.
create policy "Users can update own jobs"
  on public.jobs for update
  using (auth.uid() = user_id);

-- Storage buckets: raw (uploads), exports (generated files).
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('raw', 'raw', false, 52428800),
  ('exports', 'exports', false, 52428800)
on conflict (id) do nothing;

-- Storage policies: authenticated users can upload to their own path in raw; read via signed URLs (service role).
-- Allow insert to raw for path that starts with user id (user_id/filename).
create policy "Users can upload to own raw path"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'raw'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow select so Edge Function (service role) can read; for client we use signed URLs. Allow users to read their folder.
create policy "Users can read own raw objects"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'raw'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Exports: only service role writes; users get signed URLs from Edge Function. Allow read for own path (exports/user_id/job_id/...).
create policy "Users can read own export objects"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'exports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
