import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ClipboardCheck } from "lucide-react";
import { StatusPill, type StatusTone } from "@/components/shared/StatusPill";
import { ROUTES } from "@/routes";
import { fetchInstances, QC_STATUS_LABEL, type LinkedEntityType, type QcInstance, type QcStatus } from "./qcApi";

export const QC_STATUS_TONE: Record<QcStatus, StatusTone> = {
  in_progress: "amber",
  passed: "green",
  failed: "red",
};

/** Shows the most recent QA/QC checklist status for any linked record, so
 * checklist state is visible from the record's own page rather than only
 * on the QA/QC page. `refreshKey` lets a parent force a re-fetch after it
 * changes checklist state itself. */
export function QcChecklistBadge({
  linkedEntityType,
  linkedEntityId,
  refreshKey = 0,
}: {
  linkedEntityType: LinkedEntityType;
  linkedEntityId: string;
  refreshKey?: number;
}) {
  const [latest, setLatest] = useState<QcInstance | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setLatest(undefined);
    fetchInstances({ linkedEntityType, linkedEntityId })
      .then(instances => !cancelled && setLatest(instances[0] ?? null))
      .catch(() => !cancelled && setLatest(null));
    return () => {
      cancelled = true;
    };
  }, [linkedEntityType, linkedEntityId, refreshKey]);

  return (
    <div className="qc-badge">
      <ClipboardCheck size={14} />
      <span>QA/QC</span>
      {latest === undefined && <small>Loading…</small>}
      {latest === null && <small>No checklist yet</small>}
      {latest && <StatusPill status={QC_STATUS_LABEL[latest.status]} tone={QC_STATUS_TONE[latest.status]} />}
      <Link href={ROUTES.qaQc} className="qc-badge-link">Open</Link>
    </div>
  );
}
