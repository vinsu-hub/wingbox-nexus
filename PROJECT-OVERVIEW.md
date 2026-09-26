# WingBox Nexus — Project Overview

## What we're building

**WingBox Nexus** ("WingBox Aviation Inc.") is a system of record for a fleet MRO (Maintenance,
Repair & Overhaul) operation. It's being built from a reference spec/mockup set
(`WingBox-OS-Final-Specification.md` + 15 reference screenshots) that describes a full aviation
maintenance platform covering:

- **Aircraft records** — fleet roster, per-tail records, components, maintenance history
- **Compliance** — AD/SB (Airworthiness Directive / Service Bulletin) tracking
- **Inspections & findings** — scheduling, borescope/visual inspection results, severity-tagged
  defects tied to ATA chapters
- **A 3D damage/finding viewer** — interactive 3D model of an aircraft component (engine) with
  rotate/zoom/exploded-view/wireframe, used for client-facing inspection presentations
- **Component life tracking** — hours/cycles/remaining-life monitoring
- **Technical documentation** — manuals, service bulletins, regulatory references
- **Reporting & presentations** — generated reports, client-ready presentation decks
- **Procurement** — parts requests (Kanban + table), QA/QC checklists
- **A client-facing portal** — scoped access for airline clients
- **An AI assistant** layered across the app for cited technical/compliance Q&A

The intent is a realistic, demo-quality MRO SaaS product — not a prototype with placeholder
lorem ipsum, but pages driven by internally-consistent mock data (real-looking tail numbers,
ATA references, dates, inspector names) so it reads as a working system end to end.

## Current capabilities (what's actually built and working)

### Tech stack
React 19 + Vite 7 + TypeScript, `wouter` for routing, Tailwind v4 + hand-rolled CSS custom-property
design tokens, Framer Motion for interaction/animation, shadcn/Radix UI primitives, `sonner` for
toasts. Backend is an Express API (`server/`, zod-validated routes per module) backed by Supabase
(Postgres + Storage + Auth); schema lives in `supabase/migrations/` (`pnpm migrate`). 3D rendering uses Three.js + `@react-three/fiber` + `@react-three/drei`.

### Authentication
Real Supabase Auth. Sessions are httpOnly cookies set by the Express API (silently refreshed), so
the browser never handles tokens. Roles (Engineer / Planner / QA / Admin / Client) live in a
`profiles` table. Every API route except `/api/auth/*` requires a session; Client accounts are
read-only; creating/editing directives needs Admin or Engineer; creating QA/QC templates needs
Admin or QA. Audit entries always record the signed-in user. Demo accounts: `pnpm seed:users`.

### Fully built pages (real routes, real interactivity, not stubs)
- **Login**
- **Dashboard**
- **Fleet** — aircraft roster, row-click navigates into the aircraft record
- **Aircraft Record** (`/fleet/:tail`) — per-tail detail view with tabs
- **Inspections** — scheduling/status list
- **Compliance** — AD/SB tracking view
- **Life Tracking** — component hours/cycles/remaining-life
- **Reports** — generated report list
- **Parts Requests** — procurement board (static placeholder data)
- **Maintenance History**
- **Documents**
- **Technical Library**
- **Presentations** — list of client presentations
- **AI Assistant** — chat-style UI shell
- **Inspection Presentation** (`/inspection-presentation/:id?`) — the flagship page, see below

### The 3D engine viewer (Inspection Presentation page)
This is the most substantively "real" piece of engineering in the app so far:

- A working **3D model ingestion pipeline**: upload a `.glb`/`.gltf`, or a set of raw `.stl` parts
  from a disassembled-model kit, through `POST /api/models/ingest` or `/api/models/ingest-parts`.
  Handles format validation, structural auditing (`@gltf-transform`), Draco compression for large
  files, and persistence to Supabase Storage + a Postgres `models` table.
- The **default/persistent model is a real Airbus A320 PW127-family engine**, reconstructed from
  a genuine 28-part disassembled-engine STL kit (not a single fused mesh) — so each major part
  (fan, covers, mechanism housings, base, back) is a distinct, separable node.
- **Live Three.js viewer** with:
  - Rotate / zoom in / zoom out / pan / fullscreen controls
  - **3D View / Exploded View / Wireframe** modes — Wireframe also applies the exploded-parts
    offset, since a solid wireframe on a ~9M-triangle mesh is otherwise unreadable
  - **5 camera presets** (Inspection detail, Engine inlet, Left angle, Right angle, Lower cowl)
    that actually orbit the camera to distinct, named angles
  - Auto-fitting camera framing (works regardless of a model's source scale) with generous margin
    so exploded parts don't crowd the frame edge
- Findings side panel (mock data: 3 borescope findings with severity, corrective action, AMM/SB/AD
  references) alongside the model. On-model hotspots live on the separate Damage / 3D page.
- Export PDF / Present to Client / Gesture Mode are intentionally stubbed (toast notifications) —
  not implemented yet.

### Wave 1 modules backed by real data (Supabase)
- **Damage / 3D** — findings as numbered markers on the 3D engine (findings themselves still mock)
- **Compliance** — AD/SB directives and per-aircraft compliance records; create directives, mark
  compliance per aircraft (warns when the same person complied and signed off)
- **QA/QC** — checklist templates and runs (pass/fail/N-A, notes, photos), status computed
  server-side, status badge shown on linked records
- **Life Tracking** — components with hours/cycles/calendar limits, binding-constraint engine,
  manual readings, threshold acknowledgment; live at-risk rollup on the Dashboard
- **Delivery & Re-Delivery** — delivery/lease-return events with an auto-created records
  checklist, discrepancy log, and server-enforced sign-off gate
- **Audit log** (write-path only) — every sign-off/status change is recorded; the viewer is Wave 2

### Not yet built (nav items that fall through to a generic placeholder page)
Components, Findings, Knowledge Base, Client Access, Client Reports, Users & Roles, Templates,
Audit Log, System Settings — all Wave 2 in the build brief.

### Known next step
Wave 2 of `~/Downloads/wingbox-nexus-build-brief-wave1-wave2.md` — see `TODO.md`.

## What's mock vs. real

- **Real**: authentication and roles, the 3D ingestion pipeline and persisted engine model,
  compliance directives and records, QA/QC checklists, component life limits, delivery events,
  and the audit log — all in Supabase, with schema tracked in `supabase/migrations/`.
- **Still mock/static**: the fleet roster's richer fields, inspections, findings, reports, parts
  requests, maintenance history, documents, presentations, and the Dashboard's summary cards
  (its life-limit alert strip is live).
