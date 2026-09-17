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

## Next up: render the A320 engine into a second presentation view ("Damage / 3D")

**Goal:** the left nav already has a "Damage / 3D" item (INSPECTIONS group) that's currently an
unbuilt stub (falls through to the generic `MissingView` placeholder). The reference spec
(`WingBox-OS-Final-Specification.md` §3.10, in the WINGBOX OS reference folder) describes it as
a second, genuinely different 3D presentation context: the same interactive viewer, but with
findings shown as **numbered hotspot markers positioned directly on the 3D model surface**
(instead of only a side-panel list, as Inspection Presentation currently does). There's even
dead/unused CSS already in `client/src/index.css` for this (`.finding-hotspot`,
`.hotspot-medium`, `.hotspot-low`) — leftover from an earlier design pass, never wired up.

### Implementation plan

**1. Extend `client/src/pages/InspectionPresentation/Viewer3D.tsx` (additive only):**
- Add `export interface Viewer3DHotspot { id; partName; number; severity: "Low"|"Medium"|"High"; label }`.
- Add optional `hotspots?`, `selectedHotspotId?`, `onHotspotSelect?` props to `Viewer3D` and `GltfModel`.
- New `HotspotMarker` component: each frame, `scene.getObjectByName(hotspot.partName)` →
  `part.getWorldPosition(tmp)` → `group.parent!.worldToLocal(tmp)` → `group.position.copy(tmp)`.
  Tracks the real world position of the named part every frame, including through the Exploded
  View lerp animation, converted correctly into the marker's own parent-local space (the
  `Center`-created group) so it isn't double-transformed.
- Render via drei's `<Html>` **without the `center` prop** — `.finding-hotspot`'s existing CSS
  already does its own `translate(-50%,-50%)`; adding `center` would double that offset and
  visibly mis-position every badge. Watch for this specifically during verification.
- Skip drei's `occlude` (raycasting a ~9M-triangle scene per marker per frame is a real perf risk).
- `ProceduralEngine` and everything else in the file (modes, camera presets, Bounds/Center) stays
  untouched — hotspots are only ever passed when a real model is loaded.
- Add one new CSS rule near the existing hotspot styles for a "selected" state (ring/scale bump).

**2. New mock data — `client/src/data/mock/damage-3d.ts`:**
Same shape as `inspection-presentation.ts`'s `Finding`, plus `partName` (anchors the hotspot to a
real scene node) and `number` (stable badge number). 4 findings anchored to real, verified part
names from the curated 28-part STL kit, spread across the engine: `MainFan` (High), `BigCover1`
(Medium), `Cover2` (Low), `BackCover` (Medium). Same aircraft/engine (`RP-C8841`, PW127M · Engine
No. 2) as the existing inspection — same engine, different presentation context.

**3. New page — `client/src/pages/Damage3D/Damage3DPage.tsx`:**
Modeled on `InspectionPresentationPage.tsx` but simpler (no tab strip — spec only calls for
findings panel + filmstrip). Same `/api/models/latest` fetch, same toolbar/camera-preset pattern
(filmstrip captions relabeled: "Fan face", "Cowl", "Left angle", "Right angle", "Underside").
Findings panel reuses the existing `.inspection-report-panel`/`.findings-list`/`.finding-row`/
`.finding-detail*` classes, bound to `damageFindings`, without the `<Tabs>` wrapper. Passes
`hotspots`/`selectedHotspotId`/`onHotspotSelect` to `Viewer3D`; clicking a hotspot badge and
clicking a findings-list row both drive the same `selectedFindingId` state. No Import modal on
this page (out of scope — it showcases the already-persisted model).

**4. Routing and nav wiring:**
- `client/src/routes.ts`: add `damage3d: "/damage-3d"`.
- `client/src/components/layout/navConfig.ts`: give the `"Damage / 3D"` nav item its explicit
  path (`ROUTES.damage3d`).
- `client/src/App.tsx`: import `Damage3DPage`, add `<Route path="/damage-3d" .../>` **before**
  the `/view/:slug` catch-all. `MissingView`'s `damage-3d` copy becomes unreachable — leave it.

**5. New CSS shell:**
Small new `.damage3d-page/-breadcrumb/-header/-actions/-layout` block in `index.css`, mirroring
`.inspection-presentation-*` under honestly-named classes (~5 lines). Everything else
(`.viewer-canvas`, `.viewer-tools`, `.viewer-mode-toggle`, `.viewer-filmstrip`,
`.finding-hotspot`+variants, `.inspection-report-panel` and children, buttons) is reused verbatim.

### Files to touch

| File | Change |
|---|---|
| `client/src/pages/InspectionPresentation/Viewer3D.tsx` | Add `Viewer3DHotspot` type, optional hotspot props, `HotspotMarker` component |
| `client/src/data/mock/damage-3d.ts` | New — `DamageFinding` type, meta, 4 findings anchored to real part names |
| `client/src/pages/Damage3D/Damage3DPage.tsx` | New — page component |
| `client/src/routes.ts` | Add `damage3d` route constant |
| `client/src/components/layout/navConfig.ts` | Wire explicit path for the "Damage / 3D" nav item |
| `client/src/App.tsx` | Register new route before the `/view/:slug` catch-all |
| `client/src/index.css` | New `.finding-hotspot.selected` rule + small `.damage3d-*` shell block |

### Verification

1. `pnpm check` and `pnpm build`.
2. Live browser check (Playwright MCP is registered at user scope — `claude mcp add -s user`
   already ran for it on the Mac; re-run `claude mcp add -s user playwright -- npx -y
   @playwright/mcp@latest` on the new machine, or use `agent-browser` if installed there instead):
   - Load `/damage-3d` (direct URL and via the left-nav item) — confirm it's no longer the
     generic `MissingView` stub.
   - Confirm the real engine renders and exactly 4 hotspot badges appear, each visibly on/near a
     distinct part of the model surface — catches the `center`-prop double-offset bug if present.
   - Click a hotspot → confirm the matching findings-panel row highlights, and vice versa.
   - Exercise all 5 camera presets, Wireframe, Exploded View, and Wireframe+Exploded together —
     confirm hotspots visibly follow their part outward during the explode animation.
   - Click Export PDF / Present to Client / Gesture Mode — confirm the same stub-toast behavior
     as Inspection Presentation, no crashes.
   - Re-check `/inspection-presentation` still renders and behaves identically (regression check
     on the shared `Viewer3D` component now carrying unused-there optional props).
3. Update `.agent-state.md` with a session-log entry; commit once verified.

## Other known-good state (for context, not action items)

- Inspection Presentation's 3D viewer is fully working: real A320 engine model, 5 camera presets,
  3D View / Exploded View / Wireframe (Wireframe now also explodes for readability), generous
  Bounds margin. See `.agent-state.md` for the full history of bugs found/fixed getting here.
- ~10 of the 15 reference-mockup pages are built; remaining pages are listed in `.agent-state.md`
  session logs and fall back to `MissingView` until built.
- Playwright MCP and Firecrawl MCP are registered at user scope on the Mac (`~/.claude.json`) —
  Firecrawl still needs its OAuth login completed interactively (`claude mcp login firecrawl`).
