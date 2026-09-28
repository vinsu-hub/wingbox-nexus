# WingBox Nexus — System Capabilities & Scope

_As of 2026-09-28. Committed state is `main` at `4444852` (Wave 1 of the build brief complete).
A separate batch of **uncommitted** Wave 2 work is present in the working tree — see §6._

---

## 1. At a glance

WingBox Nexus is a fleet MRO (Maintenance, Repair & Overhaul) system of record for WingBox
Aviation Inc. It covers aircraft records, compliance, inspections, component life, QA/QC,
aircraft delivery/lease return, and an interactive 3D engine viewer. It's built from the
WingBox OS reference spec and mockups.

| | |
|---|---|
| **Pages routed** | 28 (24 in the left nav + login, aircraft record, inspection presentation, damage/3D) |
| **Backed by real data (Supabase)** | 7 modules — Auth, 3D models, Compliance, QA/QC, Life Tracking, Delivery & Re-Delivery, Audit log |
| **API endpoints** | 29 across 6 routers |
| **Database tables** | 12 (plus Supabase `auth.users`), all created by tracked migrations |
| **Roles** | Admin, Engineer, Planner, QA, Client |
| **Still mock/presentational** | Fleet details, inspections, findings, reports, parts requests, maintenance history, documents, technical library, presentations, AI assistant, dashboard cards |

---

## 2. Architecture

- **Frontend:** React 19 + Vite 7 + TypeScript, `wouter` routing, Tailwind v4 plus hand-rolled
  CSS design tokens, Framer Motion, shadcn/Radix UI, `sonner` toasts, react-hook-form + zod.
- **3D:** Three.js + `@react-three/fiber` + `@react-three/drei`. Models are processed server-side
  with `@gltf-transform` and Draco compression.
- **Backend:** one Express app (`server/apiApp.ts`) mounted at `/api`. In development it runs
  inside Vite's dev server; in production it runs inside `server/index.ts`. Every mutation's
  request body is validated with zod.
- **Data:** Supabase — Postgres for records, Storage for 3D models and QA/QC photos, Auth for
  accounts. The server uses the service-role key. The browser never talks to Supabase directly;
  everything goes through `/api`.
- **Schema as code:** `supabase/migrations/0000–0007_*.sql`, applied with `pnpm migrate`. The
  runner tracks applied files in `schema_migrations`, runs each file in a transaction, and has a
  `--dry-run` mode.

---

## 3. Access control

**Sign-in.** You sign in with email and password against Supabase Auth. The API keeps the
session in two httpOnly cookies (access + refresh) and refreshes an expired access token
silently. JavaScript never sees a token. `admin`/`admin123` no longer exists.

**Demo accounts** (created by `pnpm seed:users`). All share the password in `SEED_USER_PASSWORD`,
which lives in the gitignored `.env`.

| Account | Role | Display name |
|---|---|---|
| admin@wingbox.aero | Admin | Alex Admin |
| engineer@wingbox.aero | Engineer | John Dela Cruz |
| planner@wingbox.aero | Planner | Paula Planner |
| qa@wingbox.aero | QA | Elena Santos |
| client@wingbox.aero | Client | Skyline Air (Client) |

**Enforcement.** All rules are checked server-side; the UI only mirrors them.

- Every `/api` route except `/api/auth/*` requires a valid session. Without one it returns 401.
- **Client** accounts are read-only. Any non-GET request returns 403.
- Creating or editing a directive requires **Admin or Engineer**.
- Creating a QA/QC template requires **Admin or QA**.
- Every protected page redirects to `/login` when you're signed out.
- The header shows the real user and role, and has a Sign out menu.
- Audit entries always record the signed-in user, even if a request body claims another name.

**Not yet:** per-page hiding by role, for example a restricted Client portal view. The brief
places that in Wave 2 (item 2.2). Right now a Client can open every page read-only.

---

## 4. Modules backed by real data

### 4.1 Compliance — AD/SB tracking (`/compliance`, also a tab on Aircraft Record)
- 12 seeded directives with 95 per-aircraft compliance records.
- The fleet matrix shows every aircraft's status (Compliant, Due Soon, Overdue, N/A) and each
  directive's most urgent status.
- You can filter by aircraft, status and AD/SB type, and search by number, title or description.
- **Create directive** (Admin or Engineer): a react-hook-form + zod form with inline validation.
- **Update compliance per aircraft:** set status, complied-by, signed-off-by and complied date.
  If one person both complied and signed off, you get a warning, but the save still goes through.
- Every change is written to the audit log.

### 4.2 QA/QC checklists (`/qa-qc`)
- Three seeded templates: Borescope Inspection QA, Incoming Parts Receiving Inspection, and
  Lease Return Records Audit.
- Start a checklist against an inspection, a part request or an aircraft. Delivery events create
  their own checklist automatically.
- Mark each item Pass, Fail or N/A, add notes, and attach photos. Photos upload to a private
  Supabase bucket.
- The server always computes the result:
  - Every item needs a result, and any Fail makes the checklist Failed.
  - A photo-required item marked Pass without a photo is rejected as incomplete.
  - A completed checklist can't be submitted again (409).
- A status badge appears on the linked record's own page (Inspections, Delivery).
- Completing a checklist is written to the audit log.

### 4.3 Life Tracking — hours / cycles / calendar engine (`/life-tracking`, Aircraft Record tab, Dashboard)
- 36 seeded components with 72 life limits. A component can have several limit types at once.
- **Binding constraint:** whichever limit has the least margin left, as a percentage of that
  limit, is the one that runs out first. It's tagged "Binding".
- Status thresholds: Due Soon at 80% used, Overdue at 100%. "Approaching threshold" means 10% or
  less remaining.
- Calendar limits are calculated from the install date and have real due dates. Hours and cycles
  show "—" for the due date, because predicting a date needs utilization data that doesn't exist
  yet.
- **Update reading:** manual entry for hours and cycles. Calendar limits can't be edited, and a
  new reading can't be lower than the previous one.
- **Component detail:** shows all of a component's limits side by side. Once a limit is within
  10%, you can **Acknowledge** it.
- **Dashboard strip:** a live "N components within 10% of a life limit · M beyond limit" alert.
- Readings and acknowledgments are written to the audit log.

### 4.4 Delivery & Re-Delivery (`/delivery`)
- Tracks aircraft deliveries (in) and lease returns (redelivery). Each event records the
  aircraft, counterparty and target date.
- Creating an event also creates its records-completeness checklist. If the checklist can't be
  created, the event is rolled back too.
- **Discrepancy log:** records return-condition problems. Each one can link to a real compliance
  directive and/or a finding, and can be resolved.
- **Event status** is always calculated by the server: In Progress, Discrepancies Open, or
  Complete.
- **Final sign-off** is blocked by the server until the checklist has passed and every
  discrepancy is resolved. If it's blocked, the error names the exact reasons.
- Creating, raising, resolving and signing off are all written to the audit log.
- Demo data: one signed-off redelivery (RP-C5517 / Orix Aviation).

### 4.5 Audit log (data only)
- Every sign-off and status change records who did it, what they did, the record affected, the
  before and after state, and the time. Logins are recorded too.
- Writing to the log never throws, so a logging failure can't block the action being logged.
- There is no screen to view the log yet — that's Wave 2 (item 2.5). See §6 for an uncommitted
  mock page.

### 4.6 3D engine viewer
**Inspection Presentation** (`/inspection-presentation`)
- Shows the persisted Airbus A320-family engine. It was rebuilt from a 28-part STL kit, so every
  part is separate.
- Viewer modes:
  - **3D View**
  - **Exploded View**
  - **Wireframe**, which also explodes the parts so the lines are readable
- 5 camera presets (Inspection detail, Engine inlet, Left angle, Right angle, Lower cowl).
- Rotate, zoom, pan and fullscreen, with the camera auto-framing any model scale.
- **Import:** upload a `.glb`/`.gltf` file or a set of STL parts. The server checks the format,
  inspects the file structure, compresses files over 15 MB, and stores the model.

**Damage / 3D** (`/damage-3d`)
- The same viewer, with findings shown as numbered, severity-coloured markers on the engine.
- Markers stay attached to their part through Exploded View and Wireframe.
- Clicking a marker or a findings-list row selects the same finding in both.

**Still stubs:** Export PDF, Present to Client and Gesture Mode only show a notice.

---

## 5. Mock / presentational pages (committed)

These pages are fully built and interactive, but they read local demo data and nothing is saved.

| Page | Route | Notes |
|---|---|---|
| Dashboard | `/dashboard` | Summary cards are static; the life-limit alert strip is live |
| Fleet | `/fleet` | Roster; clicking a row opens the Aircraft Record |
| Aircraft Record | `/fleet/:tail` | Tabs: Overview, Maintenance History, Compliance (real), Life Tracking (real), Documents |
| Inspections | `/inspections` | Schedule, calendar, filters; shows the real QA/QC badge for the selected inspection |
| Reports | `/reports` | List, filters, quick actions (generation is a notice) |
| Parts Requests | `/parts-requests` | Kanban board (see §6: uncommitted rework) |
| Maintenance History | `/maintenance-history` | Timeline |
| Documents | `/documents` | Document list |
| Technical Library | `/technical-library` | Manuals, bulletins, references |
| Presentations | `/presentations` | Presentation list |
| AI Assistant | `/ai-assistant` | Chat interface only — no model connected |

---

## 6. Uncommitted work in the working tree (not in git)

A separate session has added the following locally. **None of it is committed or pushed.**
Review and commit it before relying on it — and before switching machines, since a `git clone`
won't include it.

| Page | Route | Data |
|---|---|---|
| Components | `/components` | **Real** — reuses the Life Tracking API (fleet-wide component list and detail) |
| Findings | `/findings` | Mock (`data/mock/findings.ts`) |
| Knowledge Base | `/knowledge-base` | Mock |
| Client Access | `/client-access` | Mock (derived from parts requests) |
| Client Reports | `/client-reports` | Mock |
| Users & Roles | `/users-roles` | Mock — **not** connected to the real `profiles` table |
| Templates | `/templates` | Mock — **not** connected to the real QA/QC templates |
| Audit Log | `/audit-log` | Mock — **not** reading the real `audit_events` table |
| System Settings | `/system-settings` | Mock |

It also changes existing pages:
- **Parts Requests:** reworked board and a new request form (`NewRequestForm.tsx`).
- **AI Assistant, Maintenance History, Technical Library:** larger UI updates.
- **Styling:** about 370 lines of CSS added.
- **Life Tracking API:** a new `fetchComponent` helper.
- **Assets and design artifacts:** under `client/public/assets/parts/` and `artifacts/`.

Every nav item now has a real route, so nothing falls through to the "not yet built"
placeholder page any more.

---

## 7. API reference

Everything below is under `/api` and needs a session, except `/auth/*`.

| Area | Method + path | Purpose |
|---|---|---|
| Auth | `POST /auth/login` · `POST /auth/logout` · `GET /auth/me` | Session management |
| 3D models | `GET /models/latest` | Current model with a signed URL |
| | `POST /models/ingest` | Single `.glb`/`.gltf` upload or URL import |
| | `POST /models/ingest-parts` | Multi-part STL kit, assembled into one separable GLB |
| Compliance | `GET /directives` · `GET /directives/:id` | Directives with per-aircraft records |
| | `POST /directives` · `PATCH /directives/:id` | Create/edit (Admin, Engineer) |
| | `POST /directives/:id/compliance-records` | Set one aircraft's status (upsert, warns on same-person sign-off) |
| QA/QC | `GET /qc/templates` · `POST /qc/templates` | Templates (create: Admin, QA) |
| | `GET /qc/instances` · `GET /qc/instances/:id` | Checklists (filter by linked record) |
| | `POST /qc/instances` · `PATCH /qc/instances/:id` | Start, submit (status computed server-side) |
| | `POST /qc/attachments` | Image upload, returns a signed URL |
| Life Tracking | `GET /life-tracking/components` · `/components/:id` | Evaluated limits and binding constraint (`?tail=` filter) |
| | `GET /life-tracking/summary` | Fleet rollup (approaching / overdue) |
| | `PATCH /life-tracking/limits/:id` | Manual hours/cycles reading |
| | `POST /life-tracking/limits/:id/acknowledge` | Acknowledge an at-risk limit |
| Delivery | `GET /delivery/events` · `GET /delivery/events/:id` | Events, discrepancies, checklist status |
| | `POST /delivery/events` | Create event and its checklist |
| | `POST /delivery/events/:id/discrepancies` · `PATCH /delivery/discrepancies/:id/resolve` | Discrepancy log |
| | `POST /delivery/events/:id/sign-off` | Gated final sign-off |

---

## 8. Data model

| Table | Purpose |
|---|---|
| `models` | Ingested 3D models (storage path, node/triangle counts, separable flag) |
| `aircraft` | Tail-number anchor for all other tables (12 aircraft) |
| `audit_events` | Append-only action log |
| `directives`, `directive_compliance_records` | AD/SB and per-aircraft compliance |
| `qc_checklist_templates`, `qc_checklist_instances` | QA/QC templates and runs |
| `components`, `component_life_limits` | Life-limited parts and their hours/cycles/calendar limits |
| `delivery_events`, `delivery_discrepancies` | Deliveries, lease returns, return-condition log |
| `profiles` | Role and display name for each auth user |
| `schema_migrations` | Migration tracking |

**Storage buckets:**
- `models` — 3D models
- `qc-attachments` — QA/QC photos

Both buckets are private and are read through signed URLs.

---

## 9. Operating it

```bash
pnpm install
cp .env.example .env      # fill SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_PUBLISHABLE_KEY,
                          # SUPABASE_DB_PASSWORD, SEED_USER_PASSWORD (never commit .env)
pnpm migrate              # apply schema (use -- --dry-run to preview)
pnpm seed                 # demo aircraft, directives, QA/QC templates, components (safe to re-run)
pnpm seed:users           # five role accounts (creates or resets)
pnpm dev                  # http://localhost:3000 (restart after adding a new server route)
pnpm check && pnpm build  # type-check and production build
pnpm start                # run the production build
```

`TODO.md` has the full new-machine setup and the handoff history. `.agent-state.md` has the
session-by-session engineering log.

---

## 10. Known limitations

- **Findings aren't stored yet.** They're still mock data, so Damage/3D findings and delivery
  discrepancies reference finding IDs with no database link. A real `findings` table is Wave 2
  (item 2.1).
- **Inspections and part requests aren't stored yet.** QA/QC checklists therefore link to them by
  ID only, with no database link.
- **Life Tracking ranks limits by percentage remaining.** Ranking by time until each limit is
  reached needs a history of readings or a flight-ops feed, which don't exist yet. For the same
  reason, hours and cycles limits have no projected due date. The 10% threshold is fixed until
  the Wave 2 System Settings page.
- **QA/QC templates can't be edited in the app yet.** Only the seeded ones exist; an editor is
  Wave 2 (item 2.4).
- **No page-level role gating.** A Client can view every page, read-only.
- **Some buttons are notices only.** Export PDF, Present to Client, Gesture Mode, report
  generation and "Forgot password?" don't do the real action; there is no password-reset email.
- **Parts Requests has no stored workflow.** Real requisition, approval and fulfilment is Wave 2
  or later (brief item 1.8).
- **The AI Assistant isn't connected to a model.**
- **The production JavaScript bundle is about 1.8 MB, with no code splitting yet.**

---

## 11. Remaining roadmap (build brief Wave 2)

| Item | Status |
|---|---|
| 2.1 Components & Findings pages | Pages exist uncommitted. Components uses real data; Findings needs a real table. |
| 2.2 Client Access & Client Reports | Mock pages exist uncommitted. They need per-role gating using the existing `role` in `/api/auth/me`. |
| 2.3 Knowledge Base | Mock page exists uncommitted. Search and indexing not started. |
| 2.4 Templates | Mock page exists uncommitted. Needs wiring to the real `qc_checklist_templates` table. |
| 2.5 Audit Log viewer | Mock page exists uncommitted. Needs a read API over the real `audit_events` table. |
| 2.6 Users & Roles | Mock page exists uncommitted. Needs wiring to `profiles` and the Supabase admin API. |
| 2.7 System Settings | Mock page exists uncommitted. The first real setting would be the life-tracking threshold. |
