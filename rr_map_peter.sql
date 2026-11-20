-- Riley Rag: the Map page and the new Ask Peter. Run once in Supabase (the Riley Rag project):
-- SQL Editor > New query > paste > Run. Safe to run again.

-- ---- Map: where each issue was published ----
alter table issues add column if not exists place text;
alter table issues add column if not exists lat double precision;
alter table issues add column if not exists lng double precision;
drop policy if exists "editors update issues" on issues;
create policy "editors update issues" on issues for update to authenticated using (is_editor()) with check (is_editor());

-- ---- Ask Peter: Peter answers in the Rag; letters are private to their writer and the editors ----
alter table advice add column if not exists answered_issue int;

do $$
declare col text; pol record;
begin
  -- the column that says who wrote the letter (the one linked to profiles)
  select kcu.column_name into col
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
  join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
  where tc.table_schema = 'public' and tc.table_name = 'advice' and tc.constraint_type = 'FOREIGN KEY' and ccu.table_name = 'profiles'
  limit 1;
  if col is null then raise exception 'Could not find who wrote each letter (no link from advice to profiles).'; end if;

  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'advice' loop
    execute format('drop policy %I on advice', pol.policyname);
  end loop;
  execute format('create policy "peter read" on advice for select to authenticated using (%I = auth.uid() or is_editor())', col);
  execute format('create policy "peter write" on advice for insert to authenticated with check (%I = auth.uid())', col);
  execute format('create policy "peter edit" on advice for update to authenticated using (%I = auth.uid() or is_editor()) with check (%I = auth.uid() or is_editor())', col, col);
  execute format('create policy "peter delete" on advice for delete to authenticated using (%I = auth.uid() or is_editor())', col);
end $$;

-- Readers can change the wording of their own letter until Peter answers it, but never its answered status.
create or replace function advice_guard() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not is_editor() then
    if old.answered_at is not null then raise exception 'Peter has already answered this letter.'; end if;
    new.answered_at := old.answered_at; new.answered_issue := old.answered_issue; new.answer := old.answer;
  end if;
  return new;
end $$;
drop trigger if exists advice_guard on advice;
create trigger advice_guard before update on advice for each row execute function advice_guard();
