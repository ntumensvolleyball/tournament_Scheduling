# Login and public results setup

The integrated site now uses one codebase:

- `/public.html` lists published tournaments and shows read-only match results.
- `/login.html` signs organizers in with email and password.
- `/admin.html` is the organizer dashboard and publishing screen.
- `/index.html?admin=1` and the existing tool pages are the local scheduling workspace.

The scheduler remains local-first. Editing a score updates the current browser draft. The public site changes only when an authenticated organizer presses **Publish**. This avoids exposing half-entered scores and makes the publishing boundary explicit.

## 1. Create Supabase

1. Create a Supabase project at https://supabase.com/dashboard.
2. Open the SQL Editor, paste `supabase/schema.sql`, and run it once.
3. In **Project Settings → API**, copy the Project URL and the public anon/publishable key.
4. Put those two values in `src/config.js`. The anon key is designed to be public. Never place the service-role key in this repository or browser code.
5. In **Authentication → URL Configuration**, set the Site URL to the final deployed origin. Add localhost and the Pages preview origin as redirect URLs while testing.
6. Decide whether organizers may create their own accounts. Leave email signup enabled for a small trial, or disable it after creating the organizer accounts.

Row-level security in `supabase/schema.sql` allows anyone to read only records marked public. Signed-in users can write only records whose `owner_id` is their own user ID. Public slugs are globally unique.

## 2. Test locally

Serve the repository over HTTP:

```sh
python3 -m http.server 8000
```

Then:

1. Open `http://localhost:8000/login.html`, create an organizer account, and confirm the email if required.
2. Open the scheduler from the dashboard and create or import a tournament.
3. Return to **Admin & Publish**, enter a name and slug, and publish.
4. Open the public link in a private/incognito window. Confirm that it shows the same teams, matches, scores, dates, winners, and officials but has no editing controls.
5. Change a score locally. Confirm the public page stays unchanged until Publish is pressed again, then refresh the private window and verify the update.
6. Sign in with a second test account and verify it cannot overwrite or load the first account's publication.

## 3. Deploy one integrated repository

Use `Andrew-is-alive/tournament_Scheduling` as the integration repository while this branch is being completed. Point the public domain to that deployment. The older `Andrew-is-alive/ntucup` repository should become an archive or redirect after the integrated site passes the checks above; maintaining two copies would cause the public UI and scheduler data model to drift again.

For Cloudflare Pages, use framework preset **None**, build command `npm run build`, and output directory `dist`. After deployment, update Supabase Authentication URL Configuration with the real `pages.dev` and custom-domain origins. The build excludes local backup JSON, tests, SQL, and development reference files.

## Current scope

This first backend step stores each publication as a validated JSON snapshot. It is suitable for one organizer publishing a complete tournament from the existing app. The next database revision should normalize matches and scores into separate tables if multiple scorekeepers need simultaneous live editing. That revision should use a server-side transaction for bracket progression and an audit table for score corrections.
