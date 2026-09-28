import { useState } from "react";
import { Link } from "wouter";
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardCheck, Download, FileText, Plane, RotateCcw, ShieldCheck, SlidersHorizontal, Wrench } from "lucide-react";
import { aircraft, getAircraftByTail } from "@/data/aircraft";
import { maintenanceHistory, upcomingMaintenanceEvents, type MaintenanceEvent, type MaintenanceEventType } from "@/data/mock/maintenance-history";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ROUTES } from "@/routes";

type Filters = { range: string; from: string; to: string; tail: string; type: string; inspector: string };
const emptyFilters: Filters = { range: "all", from: "", to: "", tail: "all", type: "all", inspector: "all" };
const types: MaintenanceEventType[] = ["Inspection", "Repair", "Compliance", "Maintenance"];
const icons = { Inspection: ClipboardCheck, Repair: Wrench, Compliance: ShieldCheck, Maintenance: Wrench };
const pageSizes = [10, 20, 50];
const formatDate = (value: string, options: Intl.DateTimeFormatOptions) => new Date(`${value}T12:00:00Z`).toLocaleDateString("en-US", { ...options, timeZone: "UTC" });
const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

function exportCsv(rows: MaintenanceEvent[]) {
  const headers = ["Event ID", "Date", "Type", "Title", "Tail Number", "Aircraft Type", "Check Type", "Inspector", "Status", "Timestamp"];
  const data = rows.map(row => [row.id, row.date, row.type, row.title, row.tail, row.aircraftType, row.checkType, row.inspector, row.status, row.timestamp]);
  const csv = [headers, ...data].map(cells => cells.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `maintenance-history-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function MaintenanceHistoryView({ tailNumber }: { tailNumber?: string }) {
  const [draft, setDraft] = useState<Filters>(emptyFilters);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<MaintenanceEvent | null>(null);
  const inspectors = Array.from(new Set(maintenanceHistory.map(event => event.inspector))).sort();
  const updateDraft = (field: keyof Filters, value: string) => setDraft(previous => ({ ...previous, [field]: value }));
  const scoped = maintenanceHistory.filter(event => !tailNumber || event.tail === tailNumber);
  const filtered = scoped.filter(event => {
    const rangeStart = filters.range === "30" ? "2026-08-30" : filters.range === "90" ? "2026-07-01" : filters.range === "month" ? "2026-09-01" : "";
    const rangeEnd = filters.range === "month" ? "2026-09-30" : "";
    return (!rangeStart || event.date >= rangeStart) && (!rangeEnd || event.date <= rangeEnd)
      && (!filters.from || event.date >= filters.from) && (!filters.to || event.date <= filters.to)
      && (filters.tail === "all" || event.tail === filters.tail)
      && (filters.type === "all" || event.type === filters.type)
      && (filters.inspector === "all" || event.inspector === filters.inspector);
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const featured = getAircraftByTail(tailNumber || maintenanceHistory[0].tail) ?? aircraft[0];
  const upcoming = upcomingMaintenanceEvents.filter(event => !tailNumber || event.tail === tailNumber).slice(0, 4);
  const apply = () => { setFilters(draft); setPage(1); };
  const reset = () => { setDraft(emptyFilters); setFilters(emptyFilters); setPage(1); };
  const visiblePages = Array.from({ length: pageCount }, (_, index) => index + 1).filter(number => number === 1 || number === pageCount || Math.abs(number - currentPage) <= 2);

  return (
    <section className="maintenance-history-view" aria-label="Maintenance history">
      <header className="page-heading maintenance-history-heading">
        <div>
          {!tailNumber && <div className="eyebrow"><Plane size={13} /> AIRCRAFT / MAINTENANCE HISTORY</div>}
          {tailNumber ? <h2>Maintenance History · {tailNumber}</h2> : <h1>Maintenance History</h1>}
          <p>Complete audit trail of maintenance events {tailNumber ? "for this aircraft" : "across your fleet"}.</p>
        </div>
      </header>

      <div className="maintenance-history-filters panel">
        <label><span><CalendarDays size={15} /> Date range</span><select aria-label="Date range" value={draft.range} onChange={event => updateDraft("range", event.target.value)}><option value="all">All dates</option><option value="month">September 2026</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></label>
        <label className="maintenance-history-date"><span>From</span><input aria-label="From date" type="date" value={draft.from} max={draft.to || undefined} onChange={event => updateDraft("from", event.target.value)} /></label>
        <label className="maintenance-history-date"><span>To</span><input aria-label="To date" type="date" value={draft.to} min={draft.from || undefined} onChange={event => updateDraft("to", event.target.value)} /></label>
        {!tailNumber && <label><span><Plane size={15} /> Aircraft</span><select aria-label="Aircraft" value={draft.tail} onChange={event => updateDraft("tail", event.target.value)}><option value="all">All Aircraft</option>{aircraft.map(item => <option key={item.tail} value={item.tail}>{item.tail} · {item.type}</option>)}</select></label>}
        <label><span><FileText size={15} /> Event type</span><select aria-label="Event type" value={draft.type} onChange={event => updateDraft("type", event.target.value)}><option value="all">All Event Types</option>{types.map(type => <option key={type}>{type}</option>)}</select></label>
        <label><span><ClipboardCheck size={15} /> Inspector</span><select aria-label="Inspector" value={draft.inspector} onChange={event => updateDraft("inspector", event.target.value)}><option value="all">All Inspectors</option>{inspectors.map(name => <option key={name}>{name}</option>)}</select></label>
        <div className="maintenance-history-filter-actions"><button className="primary-button" onClick={apply}><SlidersHorizontal size={14} /> Apply Filters</button><button className="secondary-button" onClick={reset}><RotateCcw size={13} /> Reset</button><button className="secondary-button maintenance-history-export" onClick={() => exportCsv(filtered)}><Download size={14} /> Export CSV</button></div>
      </div>

      <div className="maintenance-history-layout">
        <main className="maintenance-history-main panel">
          <div className="maintenance-history-list-heading"><h2>Event Timeline</h2><span>{filtered.length} {filtered.length === 1 ? "event" : "events"}</span></div>
          <div className="maintenance-history-timeline">
            {rows.map((event, index) => {
              const Icon = icons[event.type];
              const previous = rows[index - 1];
              const showDate = !previous || previous.date !== event.date;
              return <div className="maintenance-history-entry" key={event.id}>
                <div className="maintenance-history-date-label">{showDate && <><strong>{formatDate(event.date, { month: "short", day: "numeric" })}</strong><span>{event.date.slice(0, 4)}</span></>}</div>
                <div className="maintenance-history-track"><i /></div>
                <div className="maintenance-history-event"><div className={`maintenance-history-icon type-${event.type.toLowerCase()}`}><Icon size={19} /></div><div className="maintenance-history-event-name"><div><strong>{event.title}</strong><span className={`maintenance-history-type type-${event.type.toLowerCase()}`}>{event.type}</span></div><small><Plane size={11} /> {event.tail} · {event.aircraftType} · {event.checkType}</small></div><div className="maintenance-history-inspector"><span>Inspector</span><strong>{event.inspector}</strong></div><div className="maintenance-history-status"><strong className={event.status.toLowerCase()}><i />{event.status}</strong><time dateTime={event.timestamp}>{formatDate(event.date, { month: "short", day: "numeric", year: "numeric" })} · {event.timestamp.slice(11, 16)} UTC</time></div><button className="maintenance-history-details" onClick={() => setSelected(event)}>View Details <ChevronRight size={13} /></button></div>
              </div>;
            })}
            {!rows.length && <div className="maintenance-history-empty">No maintenance events match these filters. Try a different date or filter.</div>}
          </div>
          <footer className="table-footer maintenance-history-footer"><span role="status">Showing {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} maintenance events</span><div className="pagination"><button aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={14} /></button>{visiblePages.map((number, index) => <span key={number} className="maintenance-history-page-item">{index > 0 && number - visiblePages[index - 1] > 1 && <span className="maintenance-history-ellipsis">…</span>}<button aria-label={`Page ${number}`} aria-current={currentPage === number ? "page" : undefined} className={currentPage === number ? "current" : ""} onClick={() => setPage(number)}>{number}</button></span>)}<button aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight size={14} /></button></div><label>Rows per page <select aria-label="Rows per page" value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }}>{pageSizes.map(size => <option key={size}>{size}</option>)}</select></label></footer>
        </main>
        <aside className="maintenance-history-rail">
          <section className="panel maintenance-history-featured"><h2>Featured Aircraft</h2><img src="/assets/wingbox-aircraft-hero.jpg" alt={`${featured.type} aircraft in flight`} /><h3>{featured.tail} <span>· {featured.type}</span></h3><dl><div><dt><Plane size={14} /> Flight Hours</dt><dd>{featured.hours}</dd></div><div><dt><RotateCcw size={14} /> Cycles</dt><dd>{featured.cycles}</dd></div><div><dt><CalendarDays size={14} /> Next Check</dt><dd>{featured.date} · {featured.next}</dd></div></dl><Link href={ROUTES.aircraftRecord(featured.tail)} className="primary-button">View Aircraft Record <ChevronRight size={15} /></Link></section>
          <section className="panel maintenance-history-upcoming"><h2>Upcoming Events</h2>{upcoming.length ? upcoming.map(event => <div className="maintenance-history-upcoming-row" key={event.id}><div className="maintenance-history-upcoming-date"><span>{formatDate(event.date, { month: "short" }).toUpperCase()}</span><strong>{event.date.slice(8)}</strong></div><div><strong>{event.title}</strong><small>{event.tail} · {event.aircraftType}</small></div><span className={`maintenance-history-type type-${event.type.toLowerCase()}`}>{event.type}</span></div>) : <p>No scheduled events for this aircraft.</p>}</section>
        </aside>
      </div>

      <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="maintenance-history-dialog"><DialogTitle>{selected?.title}</DialogTitle><DialogDescription>Maintenance event {selected?.id}</DialogDescription>{selected && <><div className="maintenance-history-dialog-tags"><span className={`maintenance-history-type type-${selected.type.toLowerCase()}`}>{selected.type}</span><strong className={`maintenance-history-dialog-status ${selected.status.toLowerCase()}`}><i />{selected.status}</strong></div><dl><div><dt>Aircraft</dt><dd><Link href={ROUTES.aircraftRecord(selected.tail)} onClick={() => setSelected(null)}>{selected.tail}</Link> · {selected.aircraftType}</dd></div><div><dt>Check type</dt><dd>{selected.checkType}</dd></div><div><dt>Inspector</dt><dd>{selected.inspector}</dd></div><div><dt>Date</dt><dd>{formatDate(selected.date, { month: "long", day: "numeric", year: "numeric" })}</dd></div><div><dt>Timestamp</dt><dd>{selected.timestamp.slice(11, 16)} UTC</dd></div><div><dt>Event ID</dt><dd>{selected.id}</dd></div></dl></>}</DialogContent></Dialog>
    </section>
  );
}
