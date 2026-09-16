import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  AlertTriangle,
  ArrowDownUp,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Filter,
  FileText,
  MoreHorizontal,
  Plane,
  Plus,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { aircraft, type Aircraft } from "@/data/aircraft";
import { ROUTES } from "@/routes";
import { SummaryCardRow } from "@/components/shared/SummaryCardRow";
import { StatusPill } from "@/components/shared/StatusPill";

const aircraftImage = "/assets/wingbox-aircraft-hero.jpg";

export function FleetPage() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All Status");
  const [type, setType] = useState("All Types");
  const [selected, setSelected] = useState<Aircraft>(aircraft[0]);
  const [showModal, setShowModal] = useState(false);
  const filtered = useMemo(
    () =>
      aircraft.filter(
        a =>
          (a.tail + a.type + a.client).toLowerCase().includes(query.toLowerCase()) &&
          (status === "All Status" || a.status === status) &&
          (type === "All Types" || a.type === type),
      ),
    [query, status, type],
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow"><Plane size={16} /> AIRCRAFT / FLEET</div>
          <h1>Aircraft Fleet</h1>
          <p>Manage and monitor all aircraft under your fleet.</p>
        </div>
        <button className="primary-button" onClick={() => setShowModal(true)}><Plus size={16} /> Add Aircraft</button>
      </div>
      <SummaryCardRow
        className="fleet-stats"
        cards={[
          { icon: Plane, label: "Total Aircraft", value: "24", foot: "↑ 2 new this month", tone: "blue" },
          { icon: Check, label: "Active", value: "18", foot: "75% of fleet", tone: "green" },
          { icon: Clock3, label: "In Inspection", value: "4", foot: "↑ 17% of fleet", tone: "amber" },
          { icon: AlertTriangle, label: "Attention", value: "2", foot: "8% of fleet", tone: "red" },
          { icon: FileText, label: "Next Check Due", value: "5", foot: "within 7 days", tone: "violet" },
        ]}
      />
      <div className="fleet-layout">
        <section className="fleet-main panel">
          <div className="filter-row">
            <div className="table-search">
              <Search size={16} />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by tail number, model, or client..." />
            </div>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option>All Types</option><option>A320-214</option><option>ATR 72-600</option><option>A321-231</option><option>B737-800</option>
            </select>
            <select><option>All Clients</option><option>Skyline Air</option><option>Island Wings</option></select>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option>All Status</option><option>Active</option><option>In Inspection</option><option>Attention</option>
            </select>
            <button className="filter-button" onClick={() => toast("Advanced filters are ready for your next review")}><Filter size={15} /> Filters</button>
            <button className="export-button" onClick={() => toast.success("Fleet export prepared")}><Download size={15} /> Export</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="check-cell"><input type="checkbox" /></th>
                  <th>Tail Number <ArrowDownUp size={12} /></th>
                  <th>Aircraft Type</th><th>Client</th><th>Flight Hours</th><th>Cycles</th>
                  <th>Next Check</th><th>Compliance</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.tail} className={selected.tail === row.tail ? "selected-row" : ""} onClick={() => setSelected(row)}>
                    <td className="check-cell"><input type="checkbox" onClick={e => e.stopPropagation()} /></td>
                    <td><div className="tail-cell"><span className={`aircraft-dot ${row.dot}`} /> <strong>{row.tail}</strong></div></td>
                    <td>{row.type}</td>
                    <td>{row.client}</td>
                    <td>{row.hours}</td>
                    <td>{row.cycles}</td>
                    <td><b className={row.next === "5 FH" ? "critical" : ""}>{row.next}</b><small>{row.date}</small></td>
                    <td><div className="compliance"><span>{row.compliance}%</span><div><i style={{ width: `${row.compliance}%` }} /></div></div></td>
                    <td><StatusPill status={row.status} /></td>
                    <td><button className="more-button" aria-label={`More actions for ${row.tail}`} onClick={e => { e.stopPropagation(); toast(`${row.tail} actions`); }}><MoreHorizontal size={17} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>Showing <b>1–{filtered.length}</b> of 24 aircraft</span>
            <div className="pagination"><button><ChevronLeft size={15} /></button><button className="current">1</button><button>2</button><button><ChevronRight size={15} /></button></div>
            <label>Rows per page <select><option>12</option><option>24</option></select></label>
          </div>
        </section>
        <aside className="fleet-side">
          <div className="featured-card">
            <img src={aircraftImage} alt="Aircraft in flight" />
            <div className="featured-overlay"><div><strong>{selected.tail}</strong><span>{selected.type}</span></div><StatusPill status={selected.status} /></div>
          </div>
          <div className="metric-strip">
            <div><span>Flight Hours</span><b>{selected.hours}</b></div>
            <div><span>Cycles</span><b>{selected.cycles}</b></div>
            <div><span>Next Check</span><b>{selected.next}</b><small>{selected.date}</small></div>
            <div><span>Compliance</span><b className="green-text">{selected.compliance}%</b></div>
          </div>
          <button className="record-button" onClick={() => navigate(ROUTES.aircraftRecord(selected.tail))}>View Aircraft Record <ArrowRight size={16} /></button>
          <div className="side-panel">
            <div className="panel-title"><h3>Upcoming Events</h3><button onClick={() => toast("Showing all events")}>View All <ArrowRight size={13} /></button></div>
            {[
              { date: "MAY", day: "28", title: "A-Check", meta: `${selected.tail} • 42 FH`, tag: "Inspection", tone: "blue" },
              { date: "JUN", day: "02", title: "Compliance Check", meta: "RP-C7712 • AD 2024-13-05", tag: "Compliance", tone: "amber" },
              { date: "JUN", day: "10", title: "Engine Inspection", meta: "RP-C5517 • 1200 FH", tag: "Inspection", tone: "violet" },
              { date: "JUN", day: "14", title: "B-Check", meta: "RP-C9912 • 1800 FH", tag: "Inspection", tone: "blue" },
              { date: "JUN", day: "18", title: "Component Replacement", meta: "RP-C0001 • Engine", tag: "Maintenance", tone: "green" },
            ].map(e => (
              <div className="event-row" key={e.title}>
                <div className="event-date"><span>{e.date}</span><b>{e.day}</b></div>
                <div className="event-copy"><strong>{e.title}</strong><span>{e.meta}</span></div>
                <em className={`tag ${e.tone}`}>{e.tag}</em>
              </div>
            ))}
          </div>
          <div className="side-panel health-panel">
            <div className="panel-title"><h3>Fleet Health</h3><button onClick={() => toast("Health view opened")}>Details <ArrowRight size={13} /></button></div>
            <div className="health-content">
              <div className="donut"><div><strong>24</strong><span>Total Aircraft</span></div></div>
              <div className="health-legend">
                <p><i className="green" />Healthy <b>18</b><small>75%</small></p>
                <p><i className="amber" />In Inspection <b>4</b><small>17%</small></p>
                <p><i className="red" />Attention <b>2</b><small>8%</small></p>
              </div>
            </div>
          </div>
        </aside>
      </div>
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close" aria-label="Close" onClick={() => setShowModal(false)}><X size={17} /></button>
            <div className="modal-icon"><Plane size={22} /></div>
            <h2>Add aircraft to fleet</h2>
            <p>Register a new aircraft record for inspections, compliance, and life tracking.</p>
            <label>Tail number<input placeholder="e.g. RP-C7788" /></label>
            <label>Aircraft type<select><option>A320-214</option><option>A321-231</option><option>B737-800</option></select></label>
            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="primary-button" onClick={() => { setShowModal(false); toast.success("Aircraft draft saved"); }}>Save aircraft</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
