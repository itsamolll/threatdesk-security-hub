# ThreatDesk

ThreatDesk is a Railway-compatible Vite + React + TypeScript security workflow app for internal cyber teams.

## Railway deployment

Use these commands exactly:

```bash
npm install && npm run build
npm run preview -- --host 0.0.0.0 --port $PORT
```

The app is a plain Vite SPA. It does not depend on TanStack Start SSR, Cloudflare Workers, Edge runtimes, `.output/server/index.mjs`, or `dist/server/server.js`.

## Features

- Landing, login, signup, admin, and member flows
- Admin dashboard, projects, tasks, team, analytics, and settings
- Member dashboard, assigned tasks, task details, notes, and status updates
- Functional task create/delete/update/reassign actions
- Local persistent demo state for stable production assessment if no backend is configured
- Clerk React auth when `VITE_CLERK_PUBLISHABLE_KEY` is available; safe demo login fallback otherwise
- SPA fallback via `public/_redirects` for refresh/deep links
