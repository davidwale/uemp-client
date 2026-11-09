# UEMP Web Client: University Education Management Portal

React single-page app for UEMP. It provides role-based dashboards for Students, Lecturers, Department Admins
and the Super Admin.

**Live app:** https://uemp-client.vercel.app  ·  **API repo (main README, docs, demo accounts):** [uemp-api](https://github.com/davidwale/uemp-api)
**Stack:** React 19 · TypeScript · Tailwind CSS v4 · Vite · React Router 7 · TanStack Query · React Hook Form + Zod

## Demo accounts

All demo accounts use the password **`Password123!`**. The login page also has one-click buttons for each role.

| Role | Email |
|---|---|
| Student | `student@uemp.edu.ng` |
| Lecturer | `lecturer@uemp.edu.ng` |
| Department Admin | `csc.admin@uemp.edu.ng` |
| Super Admin | `admin@uemp.edu.ng` |

See the API repository's README for what to try with each account.

## Running locally

Start the API first (see the [uemp-api](https://github.com/davidwale/uemp-api) README), then:

```bash
npm install
npm run dev        # → http://localhost:5173
```

In development, Vite proxies `/api` to `http://localhost:4000` (see `vite.config.ts`), so the browser talks
to one origin and the API's `HttpOnly` session cookie works without cross-site configuration.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Unit tests (Vitest + Testing Library) |
| `npm run typecheck` / `npm run lint` | Static checks |

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | _(empty)_ | Leave empty when `/api` is served from the same origin, via the dev proxy or a host rewrite. Set it only to call the API on another origin directly. |

## Deployment (Vercel)

1. Import this repository in Vercel. `vercel.json` already sets the build (`npm run build`, output `dist/`).
2. The `/api/:path*` rewrite in `vercel.json` points at the API (`https://uemp-api-2d85.onrender.com`). Change it if the API moves.
3. On the API, set `CORS_ORIGINS` to this site's Vercel URL (`https://uemp-client.vercel.app`).

`vercel.json` configures:
- **A proxy of `/api/*` to the API.** In the browser, the UI and the API share one origin, so the API's
  `HttpOnly`, `SameSite=Lax` session cookie works as a normal first-party cookie. No cross-site cookie setup is
  needed, and browsers that block third-party cookies (such as Safari) don't break sign-in.
- **A fallback of every other path to `index.html`**, so deep links like `/admin/results` load the app.
  Vercel serves real files (JS, CSS, images) before applying rewrites.
- **Security headers** (Content-Security-Policy, `X-Frame-Options`, `nosniff`, referrer policy) and long-lived
  caching for the hashed files in `/assets`.

`VITE_API_URL` stays empty on Vercel, because requests go through the proxy.

## Project structure

```
src/
├─ app/                   router (lazy-loaded pages per role), route guards, error boundary
├─ components/ui/         design-system primitives: Button, Field, Table, Modal, Badge…
├─ components/layout/     app shell and role-based navigation
├─ features/
│  ├─ auth/               login
│  ├─ student/            dashboard, course registration, registration slip, results
│  ├─ lecturer/           dashboard, courses, result entry
│  ├─ admin/              pages shared by Dept Admin and Super Admin, plus Super Admin-only pages
│  └─ shared/             result sheet, profile, shared queries
├─ hooks/                 auth/session hooks, debounce
├─ lib/                   API client, query client, utilities
└─ types/                 API response types
```

**Key decisions**
- **Server state lives in TanStack Query.** There is no global store, because nothing in the UI needs one.
- **Authorisation comes from the API.** The UI shows actions based on the user's role and on the
  `capabilities` the API returns (e.g. whether a result sheet can be reviewed). The API remains the only enforcement point.
- **Every page is code-split**, so a student never downloads admin code.
- **Forms use React Hook Form + Zod.** Server-side validation errors (422) are mapped back onto the matching fields.
