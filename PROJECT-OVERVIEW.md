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
toasts. Backend is a small Express server (`server/`) providing a 3D-model ingestion API, backed
by Supabase (Postgres + Storage). 3D rendering uses Three.js + `@react-three/fiber` + `@react-three/drei`.

### Authentication
Simple gated login — `admin` / `admin123` required to enter the app (previously a no-op that
accepted anything).

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
  references) alongside the model — not yet wired to on-model hotspots (see below).
- Export PDF / Present to Client / Gesture Mode are intentionally stubbed (toast notifications) —
  not implemented yet.

### Not yet built (nav items that exist but fall through to a generic placeholder page)
Components, Findings, **Damage / 3D** (planned next — see `TODO.md`), Knowledge Base, QA/QC,
Client Access, Client Reports, Users & Roles, Templates, Audit Log, System Settings.

### Known next step
`TODO.md` has a fully-scoped implementation plan for **Damage / 3D** — a second presentation
context for the same real engine model, differentiated by showing findings as numbered hotspot
markers positioned directly on the 3D model surface (vs. Inspection Presentation's side-panel-only
list), reusing the existing viewer with a small additive extension.

## What's mock vs. real

- **Real**: the 3D ingestion pipeline, the persisted engine model, Supabase Storage/Postgres,
  the login gate, all routing/navigation.
- **Mock/static**: nearly all business data (fleet roster, findings, compliance directives, life
  tracking figures, reports, parts requests) — internally consistent but not backed by a real
  database beyond the `models` table. No CRUD persistence for inspections, findings, reports, etc.
  yet; actions like "Generate report" or "Schedule inspection" are toast-stub previews.
