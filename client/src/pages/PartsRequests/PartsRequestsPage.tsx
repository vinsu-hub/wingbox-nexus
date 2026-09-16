// Interim static placeholder — populated from parts request.jpg so the page
// isn't empty while Codex is unavailable. A later Codex task overwrites this
// file with the full interactive Kanban + detail-panel build (see plan).
import { Package, Plus } from "lucide-react";
import { toast } from "sonner";
import { partRequests, type PartRequest } from "@/data/mock/parts-requests";
import { StatusPill } from "@/components/shared/StatusPill";

const columns: { stage: PartRequest["stage"]; dot: "blue" | "amber" | "violet" | "green" }[] = [
  { stage: "Requested", dot: "blue" },
  { stage: "Quoted", dot: "amber" },
  { stage: "QA/QC", dot: "violet" },
  { stage: "Fulfilled", dot: "green" },
];

export function PartsRequestsPage() {
  return (
    <div className="parts-requests-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">PROCUREMENT / PARTS REQUESTS</div>
          <h1>Parts Requests</h1>
          <p>Track and manage your part requests from quote to delivery.</p>
        </div>
        <button className="primary-button" onClick={() => toast("New part request is ready for implementation")}>
          <Plus size={16} /> New Part Request
        </button>
      </div>
      <div className="parts-board">
        {columns.map(col => {
          const rows = partRequests.filter(r => r.stage === col.stage);
          const visible = rows.slice(0, 5);
          const more = rows.length - visible.length;
          return (
            <section className="parts-column" key={col.stage}>
              <div className="parts-column-head">
                <span className={`parts-column-dot ${col.dot}`} />
                <h3>{col.stage}</h3>
                <em className="parts-column-count">{rows.length}</em>
              </div>
              <div className="parts-column-cards">
                {visible.map(row => (
                  <div className="parts-card" key={row.id} onClick={() => toast(`${row.partName} details are ready for implementation`)}>
                    <div className="parts-card-photo"><Package size={22} /></div>
                    <strong>{row.partName}</strong>
                    <span className="parts-card-pn">P/N: {row.partNumber}</span>
                    <span className="parts-card-meta">{row.aircraftType}</span>
                    <div className="parts-card-footer">
                      <span>Qty: {row.qty}</span>
                      <StatusPill status={row.stage} tone={col.dot === "violet" ? "blue" : col.dot} />
                    </div>
                    <time>{row.requestDate}</time>
                  </div>
                ))}
              </div>
              {more > 0 && <button className="parts-column-more" onClick={() => toast(`${more} more requests — full board coming soon`)}>+ {more} more requests</button>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
