export type DemoAuditEvent = { id: string; actor: string; action: string; entityType: string; entityId: string; timestamp: string; beforeState: Record<string, string> | null; afterState: Record<string, string> | null };
const actors = ["admin@wingbox.aero", "engineer@wingbox.aero", "qa@wingbox.aero", "planner@wingbox.aero"];
const changes: { action: string; entityType: string; prefix: string; before: Record<string, string> | null; after: Record<string, string> }[] = [
  { action: "directive.compliance_updated", entityType: "directive", prefix: "AD-2026", before: { status: "Due Soon" }, after: { status: "Compliant" } },
  { action: "qc.checklist_completed", entityType: "qc_checklist", prefix: "QC", before: { status: "In Progress" }, after: { status: "Passed" } },
  { action: "life_limit.updated", entityType: "life_limit", prefix: "LLP", before: { cycles: "4,210" }, after: { cycles: "4,225" } },
  { action: "delivery.status_changed", entityType: "delivery", prefix: "DLV", before: { status: "In Review" }, after: { status: "Ready" } },
  { action: "directive.created", entityType: "directive", prefix: "SB-2026", before: null, after: { status: "Open" } },
  { action: "qc.checklist_started", entityType: "qc_checklist", prefix: "QC", before: null, after: { status: "In Progress" } },
];
export const demoAuditEvents: DemoAuditEvent[] = Array.from({ length: 72 }, (_, index) => {
  const change = changes[index % changes.length];
  return { id: `EVT-${String(1058 - index).padStart(4, "0")}`, actor: actors[(index * 3 + Math.floor(index / 5)) % actors.length], action: change.action, entityType: change.entityType, entityId: `${change.prefix}-${String(104 + (index * 7) % 84).padStart(3, "0")}`, timestamp: new Date(Date.UTC(2026, 8, 28, 9, 40) - index * 9.5 * 60 * 60 * 1000).toISOString(), beforeState: change.before, afterState: change.after };
});
