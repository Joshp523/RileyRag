-- Riley Rag: new-issue alerts. Run once in Supabase → SQL Editor. Safe to re-run.
-- Stores each member's phone "address" for alerts. Members can only see and change their own.
create table if not exists public.rr_push_subs(
  endpoint text primary key,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  sub jsonb not null,
  created_at timestamptz not null default now());
alter table public.rr_push_subs enable row level security;
drop policy if exists "own alerts" on public.rr_push_subs;
create policy "own alerts" on public.rr_push_subs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
