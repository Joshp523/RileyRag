-- Riley Rag: site-wide theme (Classic leather, Christmas, ...). Editors switch it from the feed; everyone sees it.
-- Run once in Supabase (the Riley Rag project): SQL Editor > New query > paste > Run. Safe to run again.
create table if not exists rr_settings(key text primary key, value text not null, updated_at timestamptz not null default now());
alter table rr_settings enable row level security;
drop policy if exists "anyone reads settings" on rr_settings;
drop policy if exists "editors change settings" on rr_settings;
drop policy if exists "editors update settings" on rr_settings;
create policy "anyone reads settings" on rr_settings for select to anon, authenticated using (true);
create policy "editors change settings" on rr_settings for insert to authenticated with check (is_editor());
create policy "editors update settings" on rr_settings for update to authenticated using (is_editor()) with check (is_editor());
grant select on rr_settings to anon, authenticated;
grant insert, update on rr_settings to authenticated;
insert into rr_settings(key, value) values ('theme', 'leather') on conflict (key) do nothing;
