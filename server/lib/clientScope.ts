import type { SessionUser } from "./auth.js";

/**
 * Central client-scoping helper — every router that reads or writes
 * business data (anything with a client_id column, see the comment at the
 * top of supabase/migrations/0008_clients.sql for exactly which tables
 * those are) must route through this file rather than hand-rolling its own
 * .eq("client_id", ...) calls. That's what makes "no cross-client leakage"
 * a property you can verify in one place instead of auditing every router.
 *
 * The server runs on the Supabase service-role key, which bypasses row-
 * level security entirely — so this file, not the database, is the actual
 * enforcement boundary. Treat every function here as security-critical.
 */

/** Impossible client_id used to force a query to return zero rows, for the
 * defensive case a caller shouldn't reach in practice (requireAuth already
 * rejects a Client-role session with no client_id) but must never silently
 * fall through to "unfiltered" if it ever does. */
const UNREACHABLE_CLIENT_ID = "00000000-0000-0000-0000-000000000000";

/** Internal staff (Engineer/Planner/QA/Admin) see every client. Only the
 * Client role is scoped to its own tenant. */
export function isScoped(user: SessionUser): boolean {
  return user.role === "Client";
}

/** The client_id a read query must be filtered to, or null when the caller
 * is internal staff and should see every client's rows unfiltered. */
export function readScopeClientId(user: SessionUser): string | null {
  if (!isScoped(user)) return null;
  return user.clientId ?? UNREACHABLE_CLIENT_ID;
}

/** Apply client scoping to a Supabase query builder in one line:
 *   let query = supabase.from("directive_compliance_records").select("*");
 *   query = scopeQuery(query, req.user);
 * No-ops for internal staff. Narrows to the caller's own client_id for the
 * Client role (or to an unreachable id if that's somehow unset — see
 * UNREACHABLE_CLIENT_ID — never to "everything").
 */
/** Deliberately untyped (not generic over T) — Supabase's PostgrestFilterBuilder
 * generics are deep enough that threading them through a wrapper function's
 * signature hits TS2589 (excessive type instantiation) at every call site.
 * The runtime behavior is exactly `query.eq("client_id", ...)`, same as
 * every router already does inline elsewhere; only the compile-time type of
 * this one call narrows to `any`, so cast the destructured `data`/`error`
 * (or the row shape) at the call site same as the rest of this codebase
 * already does with `as ComponentRow[]` etc. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function scopeQuery(query: any, user: SessionUser, column = "client_id"): any {
  const clientId = readScopeClientId(user);
  return clientId ? query.eq(column, clientId) : query;
}

/**
 * Guard for a single already-fetched row (or null) that carries client_id:
 * throws a 403-flavored error if a Client-role caller doesn't own it.
 * Use this after a .maybeSingle()/.single() fetch, before returning or
 * mutating that row — e.g. GET .../:id, PATCH .../:id, POST .../:id/action.
 * Internal staff always pass.
 */
export class ClientScopeError extends Error {
  status = 403;
  constructor() {
    super("You do not have access to this record.");
  }
}

export function assertOwnsRow(user: SessionUser, row: { client_id?: string | null } | null | undefined): void {
  if (!isScoped(user)) return;
  if (!row || row.client_id !== user.clientId) throw new ClientScopeError();
}

/** Every router's catch block already does
 *   res.status(500).json({ error: err instanceof Error ? err.message : "..." })
 * Use this instead so a thrown ClientScopeError becomes a 403, not a 500:
 *   } catch (err) { sendError(res, err, "Unknown lookup error"); }
 */
export function sendError(res: { status: (code: number) => { json: (body: unknown) => void } }, err: unknown, fallbackMessage: string): void {
  if (err instanceof ClientScopeError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: err instanceof Error ? err.message : fallbackMessage });
}

/**
 * The client_id to stamp onto a new row on write. Writes always derive
 * client_id from server-verified context (the aircraft tail being written
 * against, a parent row's own client_id, etc.) — never from a client-
 * submitted body field, and never from the caller's own identity for
 * internal staff (they have none; they're creating a record for a specific
 * client's aircraft, and that aircraft's client_id is the source of truth).
 * This function exists mainly as a naming/documentation anchor: routers
 * should look up the owning aircraft/parent row's client_id and pass it
 * straight into the insert, not accept one from req.body.
 */
export function rejectClientIdInBody(body: Record<string, unknown>): void {
  if ("clientId" in body || "client_id" in body) {
    throw new Error("client_id is derived server-side and must not be supplied in a request body.");
  }
}
