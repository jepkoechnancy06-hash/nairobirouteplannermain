# Database Connection Guide

If your website data doesn't persist or you see "in-memory storage" warnings, your PostgreSQL database is not connected. Follow these steps to fix it.

## 1. Set `DATABASE_URL` in your environment

Add to `.env` or `.env.local` (in the project root):

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

**Examples:**
- **Local PostgreSQL:** `postgresql://postgres:password@localhost:5432/veew_dev`
- **Supabase:** `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
- **Neon:** `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

**Note:** The server now loads `.env` and `.env.local` automatically on startup. Ensure your file is in the project root (same folder as `package.json`).

## 2. Push the database schema

After setting `DATABASE_URL`, create the tables:

```bash
npm run drizzle:push
```

This creates all required tables (shops, drivers, routes, users, sessions, etc.).

## 3. Restart the server

```bash
npm run dev
```

On startup you should see:
- `✅ Database storage initialized successfully` — if connected
- `⚠️ WARNING: Running with in-memory storage` — if `DATABASE_URL` is missing or invalid

## 4. Check the health endpoint

Visit or curl:

```
http://localhost:5000/health
```

The response includes `database` and `storage` status. If `database` is "unhealthy", the connection string or network is wrong.

## Common issues

| Symptom | Cause | Fix |
|--------|--------|-----|
| Data disappears on restart | No `DATABASE_URL` or using in-memory | Add `DATABASE_URL` to `.env.local` |
| "Database connection failed" | Wrong host/port/credentials | Verify connection string, test with `psql` |
| SSL errors (e.g. Supabase) | SSL not configured | Add `?sslmode=require` or use pooler URL |
| Tables don't exist | Schema not pushed | Run `npm run drizzle:push` |
| `.env` not loading | File in wrong place | Put `.env` in project root (next to `package.json`) |
| Vercel deployment | Env vars not in Vercel | Add `DATABASE_URL` in Vercel project → Settings → Environment Variables |

## Password special characters

If your password contains `@`, `#`, `/`, etc., URL-encode it:

- `@` → `%40`
- `#` → `%23`
- `/` → `%2F`

Example: `pass@word` → `pass%40word` in the connection string.

## Verify your setup

1. **Admin → Settings** — Check that `DATABASE_URL` shows as configured (masked)
2. **Admin → Overview** — Storage type should reflect database when connected
3. **Create a shop** — Restart the server; the shop should still exist if the DB is connected
