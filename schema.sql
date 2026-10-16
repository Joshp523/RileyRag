-- Run once in Supabase: SQL Editor > New query > paste > Run

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  is_editor boolean not null default false,
  created_at timestamptz default now()
);
create table issues (
  id bigint generated always as identity primary key,
  number int not null,
  issue_date date not null,
  tagline text,
  pdf_path text not null,
  img_path text not null,
  created_at timestamptz default now()
);
create table comments (
  id bigint generated always as identity primary key,
  issue_id bigint not null references issues on delete cascade,
  user_id uuid not null default auth.uid() references profiles,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz default now()
);
create table reactions (
  issue_id bigint references issues on delete cascade,
  user_id uuid default auth.uid() references profiles,
  kind text check (kind in ('approve','love','more','object')),
  primary key (issue_id, user_id, kind)
);

-- new sign-ups get a profile automatically
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles(id, name) values (new.id, coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(new.email,'@',1)));
  return new;
end $$;
create trigger on_signup after insert on auth.users for each row execute function handle_new_user();

create function is_editor() returns boolean language sql security definer set search_path = public stable as
$$ select coalesce((select is_editor from profiles where id = auth.uid()), false) $$;

alter table profiles enable row level security;
alter table issues enable row level security;
alter table comments enable row level security;
alter table reactions enable row level security;

create policy "members read" on profiles for select to authenticated using (true);
create policy "members read" on issues for select to authenticated using (true);
create policy "editor writes" on issues for all to authenticated using (is_editor()) with check (is_editor());
create policy "members read" on comments for select to authenticated using (true);
create policy "members comment" on comments for insert to authenticated with check (user_id = auth.uid());
create policy "editor deletes" on comments for delete to authenticated using (is_editor());
create policy "members read" on reactions for select to authenticated using (true);
create policy "own reactions add" on reactions for insert to authenticated with check (user_id = auth.uid());
create policy "own reactions remove" on reactions for delete to authenticated using (user_id = auth.uid());
create policy "editor removes members" on profiles for delete to authenticated using (is_editor());

-- file storage (public bucket; file names are random, so links are unguessable)
insert into storage.buckets (id, name, public) values ('issues','issues',true);
create policy "editor uploads" on storage.objects for insert to authenticated with check (bucket_id='issues' and is_editor());

-- AFTER you sign up in the app, make yourself editor (use your email):
-- update profiles set is_editor = true where id = (select id from auth.users where email = 'you@example.com');
