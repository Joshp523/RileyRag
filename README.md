# The Riley Rag: setup (about 20 minutes)

## 1. Create the Supabase project
1. Sign up at supabase.com, then **New project** (free plan). Save the database password somewhere.
2. **SQL Editor > New query**: paste all of `schema.sql` and **Run**.
3. **Authentication > Providers > Email**: turn **off** "Confirm email" so grandma can sign up without waiting on an email.
4. **Project Settings > API**: copy the **Project URL** and the **anon public** key.

## 2. Connect the app
Open `index.html` and replace `SUPABASE_URL` and `SUPABASE_ANON_KEY` near the top of the script. (The anon key is meant to be public; the security rules in `schema.sql` protect your data.)

## 3. Host on GitHub Pages
1. Create a GitHub repo, upload `index.html` and `favicon.png, favicon-32.png and emblem.png`.
2. **Settings > Pages > Deploy from branch > main / root**. Your link will be `https://USERNAME.github.io/REPO/`.
3. In Supabase, **Authentication > URL Configuration**: set **Site URL** to that link.

## 4. Make yourself the editor
Open your site and create your account. Then run the last line of `schema.sql` in the SQL Editor (with your email). Refresh the site; you'll see **Publish new issue** and **Members**.

## 5. Games, Ask Peter and emails (new)
Run `update2.sql` once in the SQL Editor. Then use the Games tab to set the first Wordler word.

## 6. Publish
Enter number, date, tagline, pick the PDF, and press **Publish**. Then email the link to your list.

## Keeping the free project awake
Free projects pause after about a week with no activity. Weekly publishing keeps yours active; if it ever pauses, press **Restore** in the Supabase dashboard.
