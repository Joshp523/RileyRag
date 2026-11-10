-- Rag Press: shared drafts so editors (Josh and Meishe) see each other's layouts.
-- Run once in Supabase: SQL Editor > New query > paste > Run.
create table if not exists rag_drafts(
  id uuid primary key,
  doc jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references profiles on delete set null
);
alter table rag_drafts enable row level security;
drop policy if exists "editors read drafts" on rag_drafts;
drop policy if exists "editors add drafts" on rag_drafts;
drop policy if exists "editors change drafts" on rag_drafts;
drop policy if exists "editors delete drafts" on rag_drafts;
create policy "editors read drafts" on rag_drafts for select to authenticated using (is_editor());
create policy "editors add drafts" on rag_drafts for insert to authenticated with check (is_editor());
create policy "editors change drafts" on rag_drafts for update to authenticated using (is_editor()) with check (is_editor());
create policy "editors delete drafts" on rag_drafts for delete to authenticated using (is_editor());
-- Draft photos go in the existing "issues" bucket under drafts/ (editor uploads are already allowed).

-- If Meishe isn't an editor yet, uncomment and use her email:
-- update profiles set is_editor = true where id = (select id from auth.users where email = 'meishe@example.com');
