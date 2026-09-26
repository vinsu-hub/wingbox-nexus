# TODO

## Why this file exists

This session's dev server kept getting killed by macOS for low memory (Zen browser tabs, Orca,
duplicate Claude Code sessions, etc. competing for RAM on the MacBook). Moving active development
to a more headroom-having machine (Ryzen 5 / GTX 1050 Ti / 32GB RAM) — this file is the handoff:
what's done, what's next, and how to pick the repo back up on a fresh machine.

## Getting started on a new machine

1. `git clone https://github.com/vinsu-hub/wingbox-nexus.git && cd wingbox-nexus`
2. Install pnpm if needed (repo pins `10.4.1` in `package.json`'s `packageManager` field):
   `npm install -g pnpm`
3. `pnpm install` — `onlyBuiltDependencies` in `package.json` already allowlists the native
   postinstall scripts (`@tailwindcss/oxide`, `esbuild`), so this should run non-interactively.
4. Copy `.env.example` to `.env` and fill in the real Supabase credentials (`SUPABASE_URL`,
   `SUPABASE_SECRET_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_DB_PASSWORD`) — **not committed,
   get these from the project owner directly, never from git history**.
5. `pnpm dev` — starts Vite + the Express API middleware on `http://localhost:3000`.
6. Login with `admin` / `admin123`.
7. The real A320 engine model is already persisted in Supabase Storage/Postgres (ingested via
   `POST /api/models/ingest-parts` from a curated 28-part STL kit) — `/inspection-presentation`
   should show it immediately via `GET /api/models/latest`, no re-ingestion needed. The GPU here
   (GTX 1050 Ti) should handle the ~9M-triangle model considerably better than the MacBook's
   integrated graphics did.
8. `pnpm check` (tsc) and `pnpm build` should both pass clean on a fresh clone — that's the
   baseline sanity check before starting new work.

## DONE: Damage / 3D on-model hotspots (Wave 1 item 1.1)

Built and verified — see `.agent-state.md`'s 2026-09-25 entry for the full story, including a
real bug found and fixed (centroid/bbox/center-relative anchor points all degenerated to a
tiny on-screen cluster because this engine's cover parts are huge and mostly separated along
the one axis the default camera looks straight down — fixed by anchoring each marker in the
camera's own screen plane instead of a fixed world direction). `Damage3DPage`, `Viewer3DHotspot`/
`HotspotMarker` in `Viewer3D.tsx`, `data/mock/damage-3d.ts`, routed at `/damage-3d`, nav wired.

## Next up: Wave 1 of the build brief (`~/Downloads/wingbox-nexus-build-brief-wave1-wave2.md`)

Two corrections to the brief's own premises, confirmed against real code before this plan was
written: Compliance and Life Tracking are already fully-built real pages (task is "wire to
Supabase," not "build a page"); QA/QC, Audit Log, and Delivery have no page at all yet (genuinely
new builds). No schema-as-code exists in the repo today (the one table, `models`, was created by
a one-off imperative script) — this plan starts with introducing a lightweight versioned
migration runner before any feature work, and adds a small `aircraft` FK-anchor table (no such
table exists yet, and every new table below FKs to a tail number).

### DONE: 0. Foundational migration infrastructure

Built and verified against the real database — see `.agent-state.md`'s 2026-09-25 (cont'd) entry.
`server/lib/dbConnection.ts`, `server/scripts/migrate.ts` (`pnpm migrate`, `pnpm migrate --
--dry-run`), `server/scripts/ensureBuckets.ts`, `server/scripts/seed.ts` (`pnpm seed`),
`supabase/migrations/0000_models.sql` + `0001_aircraft.sql` both applied. `provisionModels.ts`
deleted (fully superseded).

Final migration order (by real dependency order, not brief-item order): `0000_models` →
`0001_aircraft` → `0002_audit_events` → `0003_directives` → `0004_qc_checklists` →
`0005_life_tracking` → `0006_delivery` → `0007_profiles`.

### DONE: 1.4 Audit logging (write-path only, no UI this wave)

Built and verified against the real database — see `.agent-state.md`'s 2026-09-25 (cont'd 2)
entry. `supabase/migrations/0002_audit_events.sql` applied; `server/lib/auditLog.ts` exports
`recordAuditEvent(input)` (non-throwing, `actor` stays a plain string until 1.7). No call sites
yet — 1.2/1.3/1.5/1.6 wire it in as they're built.

### DONE: 1.2 Compliance — real CRUD

Built and verified end-to-end (curl + live browser) — see `.agent-state.md`'s 2026-09-26 entry.
`supabase/migrations/0003_directives.sql` applied and seeded (95 compliance records across 12
directives). `server/routes/directives.ts` mounted at `/api/directives`. `ComplianceView.tsx`
now fetches real data via `directivesApi.ts`'s `toDirectiveWithAffected()` reshape; gained a
"New Directive" button (`DirectiveForm.tsx`, first real react-hook-form + zod usage) and a
per-aircraft "Update" mark-as-complied action. Confirmed live: create, validation errors, the
same-person warning, and a status change propagating through the pill/summary/matrix together.

### DONE: 1.3 QA/QC

Built and verified (curl + live browser) — see `.agent-state.md`'s 2026-09-26 (cont'd) entry.
`0004_qc_checklists.sql` applied, 3 templates seeded, `qc-attachments` bucket created,
`/api/qc` routes, `/qa-qc` page, `QcChecklistBadge` on the Inspections page. Template authoring UI
deferred to Wave 2 (2.4) per the brief.

### DONE: 1.5 Life Tracking — real engine

Built and verified (curl + live browser) — see `.agent-state.md`'s 2026-09-26 (cont'd 2) entry.
`0005_life_tracking.sql` applied, 36 components / 72 limits seeded, `/api/life-tracking`, real
binding-constraint engine in `server/lib/lifeTracking.ts`, Update-reading + component detail +
acknowledge in the UI, live rollup strip on the Dashboard.

### DONE: 1.6 Delivery & Re-Delivery

Built and verified (curl + full UI flow) — see `.agent-state.md`'s 2026-09-26 (cont'd 3) entry.
`0006_delivery.sql` applied, `/api/delivery`, `/delivery` page + nav item, records checklist
auto-created from the delivery QA/QC template, server-enforced sign-off gate, audit on every
mutation. One completed demo event (RP-C5517 / Orix Aviation) kept.

**Next: 1.7 (auth hardening).**

### 1.7 Auth hardening (build last, on purpose)

- `0007_profiles.sql`: `profiles(id references auth.users(id), email, role
  Engineer/Planner/QA/Admin/Client, display_name)`.
- Mechanism — **server-mediated sessions, not a client-side Supabase Auth client** (nothing in
  `client/src` talks to Supabase directly today). New `server/routes/auth.ts` calls
  `signInWithPassword` using the existing service-role client, mints an httpOnly/secure/sameSite
  session cookie (`cookie-parser` — new small dependency — for reading it server-side).
  `requireAuth` silently calls `supabase.auth.refreshSession()` when the access token is near
  expiry, re-issuing the cookie transparently.
- Route guard (none exists today): `client/src/lib/auth.tsx` — `AuthProvider`/`useAuth()`
  calling `GET /api/auth/me` on mount, wrapping the routed tree in `App.tsx` with a
  `RequireAuth` component redirecting to `/login`. Per-role page gating stays Wave 2 (2.2).
- Server enforcement: `server/lib/auth.ts` exports `requireAuth` middleware, applied via
  `apiApp.use(requireAuth)` globally except `/auth/*`.
- `LoginPage.tsx`: replace the hardcoded check with `POST /api/auth/login`
  (`credentials:'include'`); remove/repoint the decorative "Engineer / Client / Admin login"
  button (currently wired to the same fake check).
- Seeding: `server/scripts/seedUsers.ts` using `supabase.auth.admin.createUser(...)` (Auth users
  can't be created via raw SQL) — one demo account per role + matching `profiles` rows.

### 1.8 Parts Requests — flag only, no build

Confirmed via code read: it's an interim static placeholder (own top-of-file comment says so)
despite looking built. Not touched this wave.

### Sequencing (adjusted from the brief's own order, with reasons)

Brief's stated order: 1.1 → (1.2+1.4) → 1.3 → 1.5 → 1.6 → 1.7. Adjustments: migration infra
(+ `aircraft`) goes first; **1.4 moves ahead of 1.2** since both 1.2 and 1.3's routes call
`recordAuditEvent`, so its table + helper must exist first; 1.6 correctly depends on both 1.2
and 1.3 (brief's order already satisfies this); 1.5 has no real dependency on 1.2/1.3/1.4, left
in place; 1.7 last is correct — retrofitting `requireAuth` onto six already-built route files at
the end is less error-prone than threading partial auth through each as it's built.

**Final order:** foundational infra → 1.1 (done) → 1.4 → 1.2 → 1.3 → 1.5 → 1.6 → 1.7.

### Verification (per item)

`pnpm check` + `pnpm build` right after each item lands. After any new `.sql` file:
`pnpm migrate -- --dry-run` then `pnpm migrate` for real, then a spot-check query. Live browser
checks via `agent-browser` (Playwright MCP has a known screenshot-timeout issue specifically on
WebGL-heavy pages like Inspection Presentation/Damage-3D — not relevant to 1.2-1.7, no WebGL
there). Per-item specifics: 1.2 seed 50+ rows, verify filter/sort + persistence across refresh;
1.3 complete a checklist end to end, confirm rollup + linked-entity status display; 1.4 query
`audit_events` directly after a 1.2/1.3 action; 1.5 manual-enter a value, confirm binding
constraint + dashboard rollup recompute; 1.6 full event → checklist → discrepancy → sign-off
flow; 1.7 login with a seeded account, confirm `admin`/`admin123` no longer works, confirm
unauthenticated redirect and 401 on protected API routes.

## Other known-good state (for context, not action items)

- Inspection Presentation's 3D viewer is fully working: real A320 engine model, 5 camera presets,
  3D View / Exploded View / Wireframe (Wireframe now also explodes for readability), generous
  Bounds margin. See `.agent-state.md` for the full history of bugs found/fixed getting here.
- ~10 of the 15 reference-mockup pages are built; remaining pages are listed in `.agent-state.md`
  session logs and fall back to `MissingView` until built.
- Playwright MCP and Firecrawl MCP are registered at user scope on the Mac (`~/.claude.json`) —
  Firecrawl still needs its OAuth login completed interactively (`claude mcp login firecrawl`).
