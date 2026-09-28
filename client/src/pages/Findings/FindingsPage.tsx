import { useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { findings } from "@/data/mock/findings";
import { SummaryCardRow } from "@/components/shared/SummaryCardRow";
import { StatusPill } from "@/components/shared/StatusPill";

export function FindingsPage() {
  const [query, setQuery] = useState("");
  const [tail, setTail] = useState("");
  const [ata, setAta] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState(findings[0].id);
  const visible = findings.filter(f => (!tail || f.tail === tail) && (!ata || f.ataChapter === ata) && (!severity || f.severity === severity) && (!status || f.status === status) && `${f.id} ${f.title} ${f.tail} ${f.inspectionId} ${f.partName}`.toLowerCase().includes(query.toLowerCase()));
  const selected = visible.find(f => f.id === selectedId) ?? visible[0];
  return <section className="findings-page">
    <header className="page-heading"><div><div className="eyebrow">INSPECTIONS / FINDINGS</div><h1>Findings</h1><p>Review inspection observations and corrective actions across your fleet.</p></div><span className="findings-page-demo">Fleet demonstration data</span></header>
    <SummaryCardRow cards={[
      { icon: ClipboardList, label: "Total findings", value: String(findings.length), foot: `${new Set(findings.map(f => f.tail)).size} aircraft`, tone: "blue" },
      { icon: AlertTriangle, label: "Open", value: String(findings.filter(f => f.status === "Open").length), foot: "Awaiting resolution", tone: "amber" },
      { icon: ShieldAlert, label: "High severity · open", value: String(findings.filter(f => f.severity === "High" && f.status === "Open").length), foot: "Priority review", tone: "red" },
      { icon: CheckCircle2, label: "Closed", value: String(findings.filter(f => f.status === "Closed").length), foot: "Corrective action recorded", tone: "green" },
    ]} />
    <div className="panel findings-page-filters"><label className="table-search"><input aria-label="Search findings" placeholder="Search finding, component, tail or inspection…" value={query} onChange={e => setQuery(e.target.value)} /></label>
      <select aria-label="Aircraft tail" value={tail} onChange={e => setTail(e.target.value)}><option value="">All aircraft</option>{Array.from(new Set(findings.map(f => f.tail))).sort().map(v => <option key={v}>{v}</option>)}</select>
      <select aria-label="ATA chapter" value={ata} onChange={e => setAta(e.target.value)}><option value="">All ATA chapters</option>{Array.from(new Set(findings.map(f => f.ataChapter))).sort().map(v => <option value={v} key={v}>ATA {v}</option>)}</select>
      <select aria-label="Severity" value={severity} onChange={e => setSeverity(e.target.value)}><option value="">All severities</option>{["Low", "Medium", "High"].map(v => <option key={v}>{v}</option>)}</select>
      <select aria-label="Finding status" value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{["Open", "Closed"].map(v => <option key={v}>{v}</option>)}</select>
      <button className="components-page-reset" onClick={() => { setQuery(""); setTail(""); setAta(""); setSeverity(""); setStatus(""); }}>Reset</button>
    </div>
    <div className="findings-page-layout"><div className="panel findings-page-list"><div className="components-page-panel-heading"><h2>Fleet findings</h2><span>{visible.length} of {findings.length} findings</span></div><div className="findings-list">{visible.map(f => <button key={f.id} className={`finding-row ${selected?.id === f.id ? "selected" : ""}`} aria-pressed={selected?.id === f.id} onClick={() => setSelectedId(f.id)}><span className="finding-number">{String(f.number).padStart(2, "0")}</span><span className="finding-row-copy"><strong>{f.title}</strong><small>{f.tail} · {f.ataSection} · {f.status}</small><small>{f.inspectionId} · {f.location}</small></span><StatusPill status={f.severity} /></button>)}</div>{!visible.length && <p className="table-empty">No findings match your filters.</p>}</div>
      {selected ? <article className="finding-detail findings-page-detail"><div className="finding-detail-heading"><div><span>Selected finding · {selected.id}</span><h3>{selected.title}</h3></div><StatusPill status={selected.status} /></div>
        <div className="findings-page-context"><Link href={`/fleet/${selected.tail}`}>{selected.tail}</Link><span>{selected.inspectionId}</span><small>{selected.checkType}</small></div>
        <div className="finding-detail-section"><h4>Location & component</h4><p>{selected.location}<br />{selected.partName} · {selected.ataSection}</p></div>
        <div className="finding-detail-section"><h4>Description</h4><p>{selected.description}</p></div><div className="finding-detail-section"><h4>Corrective Action</h4><p>{selected.correctiveAction}</p></div>
        <div className="finding-detail-meta"><div><span>Severity</span><StatusPill status={selected.severity} /></div><div><span>Created</span><b>{selected.createdAt}</b></div><div><span>Created by</span><b>{selected.createdBy}</b></div></div>
        <div className="finding-references"><h4>Related References</h4>{selected.references.map(r => <div className="findings-page-reference" key={r.label}><strong>{r.label}</strong><small>{r.detail}</small></div>)}</div><p className="findings-page-note">Demonstration record · references are illustrative.</p>
      </article> : <aside className="panel findings-page-detail"><p className="table-empty">Select a finding after adjusting your filters.</p></aside>}
    </div>
  </section>;
}
