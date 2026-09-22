# Tournament Scheduler

A browser-based volleyball tournament builder and scheduler. Open `index.html` to use the calendar, or start with **Team controls → Add Team** and **Create Tournament**.

Create teams with tags and weekday availability, then build elimination brackets (including third-place matches) or repeated round-robin tournaments. Schedule games, enter scores, assign officials, and export or restore backups. Data stays in your browser’s localStorage.

- [Storage reference](LOCAL_STORAGE_README.md)
- [Login, Supabase, and public-results setup](SUPABASE_SETUP.md)
- Run regression checks with `npm test`.

The integrated routes are `public.html` for spectators, `login.html` for organizer access, and `admin.html` for publishing the current browser draft.

Run `npm run build` before deployment. Cloudflare Pages should publish the generated `dist` directory.
