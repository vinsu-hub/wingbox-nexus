import { DemoDataBadge } from "@/components/DemoDataBadge";
import { useState } from "react";
import { Eye, FileBarChart2, FileText, Search, Share2 } from "lucide-react";
import { aircraft } from "@/data/aircraft";
import { clientReports, type ClientReport } from "@/data/mock/client-reports";
import { StatusPill } from "@/components/shared/StatusPill";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ClientReportsPage() {
  const [query, setQuery] = useState("");
  const [client, setClient] = useState("All clients");
  const [status, setStatus] = useState("All statuses");
  const [selected, setSelected] = useState<ClientReport | null>(null);
  const clients = Array.from(new Set(clientReports.map(report => report.client)));
  const visible = clientReports.filter(report =>
    (client === "All clients" || report.client === client) &&
    (status === "All statuses" || report.status === status) &&
    `${report.name} ${report.id} ${report.client} ${report.tail} ${report.type}`.toLowerCase().includes(query.trim().toLowerCase())
  );
  return <section className="client-reports-page">
    <DemoDataBadge variant="page" />
    <header className="page-heading"><div><span className="eyebrow">CLIENT PORTAL / DISTRIBUTION</span><h1>Client Reports</h1><p>Reports shared with clients, with a clear record of who has viewed them.</p></div></header>
    <div className="client-report-stats"><div><span className="client-stat-icon"><Share2 size={18} /></span><span>Reports shared</span><strong>{clientReports.length}</strong><small>Across {clients.length} client workspaces</small></div><div><span className="client-stat-icon"><Eye size={18} /></span><span>Viewed</span><strong>{clientReports.filter(report => report.status === "Viewed").length}</strong><small>Opened by clients</small></div><div><span className="client-stat-icon"><FileBarChart2 size={18} /></span><span>Awaiting a view</span><strong>{clientReports.filter(report => report.status === "Not Viewed").length}</strong><small>Shared and available</small></div></div>
    <div className="client-report-panel panel"><div className="client-report-panel-head"><div><h2>Shared reports</h2><p>Distribution log for client-facing report copies.</p></div><span>{visible.length} results</span></div>
      <div className="client-report-filters"><label className="client-report-search"><Search size={16} /><input aria-label="Search client reports" placeholder="Search report, client, or tail…" value={query} onChange={event => setQuery(event.target.value)} /></label><label><span>Client</span><select aria-label="Filter by client" value={client} onChange={event => setClient(event.target.value)}><option>All clients</option>{clients.map(value => <option key={value}>{value}</option>)}</select></label><label><span>View status</span><select aria-label="Filter by view status" value={status} onChange={event => setStatus(event.target.value)}><option>All statuses</option><option>Viewed</option><option>Not Viewed</option></select></label></div>
      <div className="client-report-table-wrap"><table><thead><tr><th>Report</th><th>Client</th><th>Aircraft / Tail</th><th>Shared</th><th>Status</th><th>Action</th></tr></thead><tbody>{visible.map(report => <tr key={report.id}><td data-label="Report"><div className="client-report-name"><span><FileText size={17} /></span><div><strong>{report.name}</strong><small>{report.id} · {report.type}</small></div></div></td><td data-label="Client">{report.client}</td><td data-label="Aircraft"><strong>{report.tail}</strong><small>{aircraft.find(item => item.tail === report.tail)?.type}</small></td><td data-label="Shared">{report.sharedAt}</td><td data-label="Status"><StatusPill status={report.status} tone={report.status === "Viewed" ? "green" : "amber"} /></td><td data-label="Action"><button className="client-report-view" onClick={() => setSelected(report)}><Eye size={14} /> View</button></td></tr>)}</tbody></table>{!visible.length && <div className="client-report-empty">No reports match these filters.</div>}</div>
    </div><p className="client-demo-note">Demo distribution records · Report files are not connected in this preview.</p>
    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="client-report-dialog"><DialogHeader><span className="eyebrow">SHARED REPORT / {selected?.id}</span><DialogTitle>{selected?.name}</DialogTitle><DialogDescription>{selected?.type} report for {selected?.client}</DialogDescription></DialogHeader>{selected && <><p className="client-report-summary">{selected.summary}</p><dl><div><dt>Client</dt><dd>{selected.client}</dd></div><div><dt>Aircraft</dt><dd>{selected.tail} · {aircraft.find(item => item.tail === selected.tail)?.type}</dd></div><div><dt>Shared on</dt><dd>{selected.sharedAt}</dd></div><div><dt>Shared by</dt><dd>{selected.sharedBy}</dd></div><div><dt>View status</dt><dd><StatusPill status={selected.status} tone={selected.status === "Viewed" ? "green" : "amber"} /></dd></div></dl><p className="client-report-file-note">This preview shows the distribution record. The report file is not connected in this demo.</p></>}</DialogContent></Dialog>
  </section>;
}
