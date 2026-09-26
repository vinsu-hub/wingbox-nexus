import { supabase } from "./supabase.js";

export const AUDIT_EVENTS_TABLE = "audit_events";

export interface AuditEventInput {
  /** Who performed the action — callers pass `auditActor(req)`, i.e. the
   * authenticated session user, never a name typed into a form. */
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: unknown;
  afterState?: unknown;
}

/** Records a sign-off/status-change event. Best-effort and non-throwing:
 * a failed audit write must never fail the primary action it's logging
 * (e.g. marking a directive complied) — this logs the error and returns
 * rather than propagating it. No UI reads this table yet (Wave 2 item
 * 2.5); this just makes sure the data exists when that lands. */
export async function recordAuditEvent(input: AuditEventInput): Promise<void> {
  const { error } = await supabase.from(AUDIT_EVENTS_TABLE).insert({
    actor: input.actor,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    before_state: input.beforeState ?? null,
    after_state: input.afterState ?? null,
  });
  if (error) {
    console.error(`recordAuditEvent failed (action=${input.action}, entity=${input.entityType}/${input.entityId}):`, error.message);
  }
}
