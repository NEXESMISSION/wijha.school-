# Analytics troubleshooting (Wijha)

## Fixed in code (dashboard)

- **Realtime "active now" was always 0**: `loadRealtimeStats` used `{ data: activeEventsRes }` from Supabase, then read `activeEventsRes.data` (wrong). The variable is already the row array; this made the active count always empty.

## Common reasons numbers look "wrong" or stale

1. **Deployed site still on old JS**: Hard refresh (Ctrl+F5) or purge CDN cache after deploy.
2. **Dashboard reads a different Supabase project** than production: check `js/config.js` URL/key matches the live project.
3. **RLS / policies**: Anon must `INSERT` on `events`, `sessions`, `registrations`. Authenticated must `SELECT` for dashboard. A single failed insert used to disable the tracker after one error (mitigated: multiple failures now required).
4. **Session upsert fails but events work** (or the opposite): KPIs mix `sessions` and `events`; we now prefer **max(unique `page_view` sessions, session rows)** for visitors where applicable.
5. **Supabase default row limit (often 1000)**: Large `select()` without pagination can under-count unique visitors for long ranges. For heavy traffic, use SQL views/RPC or paginate.
6. **Realtime feed**: `postgres_changes` needs **Realtime enabled** for `public.events` (and relevant tables). If off, updates rely on polling (interval in `dashboard.js`).
7. **Timezone "today"**: "Today" uses the **browser's local midnight** on the machine opening the dashboard, not necessarily Tunisia time.
8. **Same visitor, same tab**: `session_id` is stored in `sessionStorage` — one session per tab until the tab is closed.
9. **Ad blockers / privacy browsers**: Can block `*.supabase.co` requests; tracking silently stops after repeated failures.
10. **CSP / connect-src**: If headers block Supabase domain, fetches fail (check browser console / Network).
11. **Registrations without events**: Possible if tracking is blocked but form insert still succeeds — you may see registrations with low visitor counts until tracking works.

## Optional: reset analytics data (destructive)

Run in Supabase SQL Editor only if you accept **deleting all analytics rows**:

```sql
TRUNCATE TABLE events RESTART IDENTITY CASCADE;
TRUNCATE TABLE sessions RESTART IDENTITY CASCADE;
-- Do NOT truncate registrations unless you intend to wipe leads.
```

After truncate, redeploy or hard-refresh the landing page so new sessions/events repopulate.
