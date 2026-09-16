import { useParams } from "wouter";
import { getAircraftByTail } from "@/data/aircraft";

// STUB — Wave 1 Codex task builds the full tab shell (Overview | Maintenance
// History | Compliance | Life Tracking | Documents) per spec 3.3 and
// fleet-aircraft record.jpg. This file is owned exclusively by that task.
export function AircraftRecordPage() {
  const { tail } = useParams<{ tail: string }>();
  const record = getAircraftByTail(tail);
  return (
    <div className="module-view">
      <h1>{record ? `${record.tail} — Aircraft Record` : "Aircraft not found"}</h1>
      <p>Full aircraft record view is under construction.</p>
    </div>
  );
}
