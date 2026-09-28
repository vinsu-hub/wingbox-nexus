# Admin pages implementation

Implemented four routes and navigation targets: `/users-roles`, `/templates`, `/audit-log`, and `/system-settings`. All pages use the app's established page heading, panel, shared FilterableTable, status pill, dialog, and handwritten CSS patterns.

- Users & Roles: 18 sample members, role/status filters, search, session-only role selector, and invitation toast that states no message is sent.
- Templates: eight sample checklist/report/delivery templates, type filter, search, preview dialog, and creation toast.
- Audit Log: 72 mock events shaped around `recordAuditEvent` fields, actor/action/entity/date filters, before/after preview, and progressive loading. Existing `server/lib/auditLog.ts` writes audit events, but there is no GET route under `server/routes`; real read wiring remains a follow-up.
- System Settings: organization details, notification switches, and a 10% life-limit warning-window preview. The server's fixed 0.10 threshold is unchanged; saving states clearly that changes are not persisted.

Verification: `pnpm check` and `pnpm build` passed. Playwright signed in as the seeded admin on port 3000, captured desktop and mobile screenshots for all four pages in this directory, exercised filters/dialogs/session controls, and recorded no page errors. The build emitted its existing large-chunk warning.
