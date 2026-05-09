# ThreatDesk

A small internal-tool for cybersecurity teams to manage network-security
findings — open ports, firewall rules, suspicious logins, router configs,
internal scan results — and walk them through investigation to resolution.

This was built as a take-home assessment, so the surface area is intentionally
small but the moving parts are real: Clerk auth, Postgres with role-based
access, REST-style server functions, and a polished dark dashboard.

## Roles

- **Security Lead (Admin)** — the first user to sign up. Creates projects and
  tasks, assigns them to analysts, can change any status, and sees the full
  team analytics view.
- **Analyst (Member)** — every subsequent signup. Sees only the tasks
  assigned to them, updates status, posts investigation notes.

## Stack

- TanStack Start v1 (React 19, Vite 7) for SSR + file-based routing
- Clerk for authentication (email + password, Google)
- Supabase Postgres for storage, accessed server-side via service role
- Tailwind v4 with custom OKLCH theme
- Recharts for the analytics view
- Zod for input validation on every server function

## Project structure

```
src/
  routes/                   file-based routes
    index.tsx               landing page
    login.tsx               role-aware Clerk SignIn
    signup.tsx              Clerk SignUp
    _authenticated.tsx      gated layout (syncs Clerk → users table)
    _authenticated/
      dashboard.tsx         role-aware overview
      tasks.tsx             list + create
      tasks.$id.tsx         detail, notes, status, reassign
      projects.tsx
      team.tsx              admin-only
      analytics.tsx         admin-only charts
      profile.tsx           member self-view
      settings.tsx
  lib/
    threatdesk.functions.ts every REST/server function (Zod-validated)
    auth-server.ts          Clerk session → ThreatDesk user sync
  components/threatdesk/    badges, app shell
supabase/migrations/        schema + seed data
```

## Database

Five tables: `users`, `projects`, `tasks`, `task_notes`, `activity_logs`.
Tasks have `severity` (low → critical), `priority`, and `status` (pending,
in_progress, under_review, resolved, overdue) — all enforced as Postgres
enums.

Role enforcement lives in the server functions (`requireUser`,
`requireAdmin`). The Supabase service role key never leaves the server.

## Login flow

The landing page has two CTAs: **Login as Admin** and **Login as Member**.
Both open the same Clerk widget — the role choice is just a hint passed via
`/login?role=admin|member`. The actual role is decided when the user is first
synced into the `users` table: signup #1 becomes Admin, everyone after is a
Member. After login, both roles land on `/dashboard`, which renders the
correct view automatically.

## Demo data

The seed migration creates five realistic network-security tasks:
- Open Port Exposure Review
- Firewall Rule Audit
- Suspicious Login Investigation
- Router Configuration Review
- Internal Network Scan Review

When a new Member signs up, two unassigned tasks are auto-handed to them so
the Member dashboard isn't empty on first login.

## Running locally

```
bun install
bun run dev
```

Required env vars:

```
CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

## Deploying

The recommended target is Cloudflare Workers (the build is already wired for
it via `wrangler.jsonc`). For a Worker deploy:

```
bunx wrangler deploy
```

Set the same env vars above as Worker secrets:

```
bunx wrangler secret put CLERK_SECRET_KEY
bunx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# …etc
```

In Clerk, add the deployed origin to the allowed list under
**Domains → Add domain**, otherwise the SignIn widget will refuse to mount.

### Deploying on Railway

The Worker bundle isn't a Node server, so a stock Railway "Node" service
won't run the build output directly. Two practical options:

1. **Cloudflare Workers (recommended)** — point Railway at nothing and use
   `wrangler deploy` from CI. This is the path the codebase is configured
   for.
2. **Node host on Railway** — switch the Vite config off the
   `cloudflare` plugin and onto a Node SSR adapter, then run `node
   .output/server/index.mjs` (or equivalent) in the Railway service. This
   requires a config change and isn't included by default.

Whichever you pick, the only deploy-time gotchas are: (a) all env vars must
be set on the host, and (b) the deployed origin must be added to Clerk.

## License

Built for assessment purposes.
