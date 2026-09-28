import { useEffect, useState } from "react";
import { AlertTriangle, Box, CheckCircle2, Clock3 } from "lucide-react";
import { Link } from "wouter";
import { FilterableTable, type TableColumn } from "@/components/shared/FilterableTable";
import { StatusPill } from "@/components/shared/StatusPill";
import { SummaryCardRow } from "@/components/shared/SummaryCardRow";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { fetchComponent, fetchComponents, LIMIT_LABEL, LIMIT_SUFFIX, type ApiComponent } from "@/pages/LifeTracking/lifeTrackingApi";

const chapterOf = (c: ApiComponent) => c.ataChapter?.replace(/^ATA\s*/i, "").split("-")[0] || "Unassigned";

export function ComponentsPage() {
  const [components, setComponents] = useState<ApiComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [tail, setTail] = useState("");
  const [ata, setAta] = useState("");
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ApiComponent | null>(null);
  const [detailError, setDetailError] = useState("");
  const load = () => { setLoading(true); setError(""); fetchComponents().then(setComponents).catch(err => setError(err.message)).finally(() => setLoading(false)); };
  useEffect(load, []);
  useEffect(() => {
    let active = true;
    setDetail(null); setDetailError("");
    if (selectedId) fetchComponent(selectedId).then(value => { if (active) setDetail(value); }).catch(err => { if (active) setDetailError(err.message); });
    return () => { active = false; };
  }, [selectedId]);
  const rows = components.filter(c => (!tail || c.tail === tail) && (!ata || chapterOf(c) === ata) && (!status || (c.bindingStatus ?? "No limits") === status) && `${c.description} ${c.tail} ${c.partNumber} ${c.serialNumber}`.toLowerCase().includes(query.toLowerCase()));
  const columns: TableColumn<ApiComponent>[] = [
    { key: "component", header: "Component", render: c => <button className="components-page-link" onClick={() => setSelectedId(c.id)}><strong>{c.description}</strong><small>P/N {c.partNumber}</small></button> },
    { key: "tail", header: "Aircraft", render: c => <Link href={`/fleet/${c.tail}`}>{c.tail}</Link> },
    { key: "serial", header: "Serial number", render: c => c.serialNumber },
    { key: "ata", header: "ATA", render: c => c.ataChapter ?? "—" },
    { key: "binding", header: "Binding constraint", render: c => { const limit = c.limits.find(l => l.id === c.bindingLimitId); return limit ? <><strong>{LIMIT_LABEL[limit.limitType]}</strong><small>{Math.round(limit.remaining).toLocaleString()} {LIMIT_SUFFIX[limit.limitType]} remaining</small></> : "No limits"; } },
    { key: "health", header: "Binding health", render: c => <StatusPill status={c.bindingStatus ?? "No limits"} /> },
  ];
  return <section className="components-page">
    <header className="page-heading"><div><div className="eyebrow">AIRCRAFT / COMPONENTS</div><h1>Components</h1><p>One fleet inventory. Every life limit, with the binding constraint in focus.</p></div><button className="secondary-button" onClick={load} disabled={loading}>Refresh</button></header>
    <SummaryCardRow cards={[
      { icon: Box, label: "Tracked components", value: loading ? "—" : String(components.length), foot: `${new Set(components.map(c => c.tail)).size} aircraft`, tone: "blue" },
      ...(["Healthy", "Due Soon", "Overdue"] as const).map((label, i) => ({ icon: [CheckCircle2, Clock3, AlertTriangle][i], label, value: loading ? "—" : String(components.filter(c => c.bindingStatus === label).length), foot: "By binding constraint", tone: (["green", "amber", "red"] as const)[i] })),
    ]} />
    {error && <p className="components-page-error" role="alert">Could not load components: {error}</p>}
    <div className="panel components-page-panel"><div className="components-page-panel-heading"><h2>Fleet component inventory</h2><span>Select a component to inspect all limits</span></div>
      <FilterableTable columns={columns} rows={rows} getRowId={c => c.id} searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search component, tail, part or serial…" emptyMessage={loading ? "Loading components…" : error ? "Component inventory unavailable. Use Refresh to retry." : "No components match your filters."} filters={<>
        <select aria-label="Aircraft tail" value={tail} onChange={e => setTail(e.target.value)}><option value="">All aircraft</option>{Array.from(new Set(components.map(c => c.tail))).sort().map(t => <option key={t}>{t}</option>)}</select>
        <select aria-label="ATA chapter" value={ata} onChange={e => setAta(e.target.value)}><option value="">All ATA chapters</option>{Array.from(new Set(components.map(chapterOf))).sort().map(a => <option key={a}>{a}</option>)}</select>
        <select aria-label="Binding health" value={status} onChange={e => setStatus(e.target.value)}><option value="">All health statuses</option>{["Healthy", "Due Soon", "Overdue", "No limits"].map(s => <option key={s}>{s}</option>)}</select>
        <button className="components-page-reset" onClick={() => { setQuery(""); setTail(""); setAta(""); setStatus(""); }}>Reset</button>
      </>} footer={<div className="table-footer">Showing {rows.length} of {components.length} components · Live life-tracking data</div>} />
    </div>
    <Dialog open={selectedId !== null} onOpenChange={open => { if (!open) setSelectedId(null); }}><DialogContent className="components-page-detail"><DialogTitle>{detail?.description ?? "Component detail"}</DialogTitle><DialogDescription>{detail ? `${detail.tail} · P/N ${detail.partNumber} · S/N ${detail.serialNumber}` : "Retrieving the latest component and life limits."}</DialogDescription>
      {detailError ? <p role="alert">{detailError}</p> : !detail ? <p role="status">Loading component…</p> : <>
        <div className="components-page-meta"><span>ATA <strong>{detail.ataChapter ?? "Unassigned"}</strong></span><span>Installed <strong>{detail.installDate}</strong></span><StatusPill status={detail.bindingStatus ?? "No limits"} /></div>
        <p className="components-page-note">The highlighted binding limit is the constraint reached first, as evaluated by the server. Calendar usage is in months; remaining calendar life is in days.</p>
        <div className="components-page-limits">{detail.limits.map(l => <article key={l.id} className={`components-page-limit ${l.id === detail.bindingLimitId ? "is-binding" : ""}`}><header><h3>{LIMIT_LABEL[l.limitType]}</h3>{l.id === detail.bindingLimitId && <span className="life-binding-tag">Binding limit</span>}<StatusPill status={l.status} /></header><dl><div><dt>Used</dt><dd>{l.usedValue.toLocaleString(undefined, { maximumFractionDigits: 1 })} {l.limitType === "calendar_months" ? "months" : LIMIT_SUFFIX[l.limitType]}</dd></div><div><dt>Remaining</dt><dd>{Math.round(l.remaining).toLocaleString()} {LIMIT_SUFFIX[l.limitType]}</dd></div><div><dt>Life used</dt><dd>{l.usedPct.toFixed(1)}%</dd></div><div><dt>Limit</dt><dd>{l.limitValue.toLocaleString()} {l.limitType === "calendar_months" ? "months" : LIMIT_SUFFIX[l.limitType]}</dd></div></dl><p>Projected due: {l.projectedDueDate ?? "Requires utilization data"}</p></article>)}</div>{!detail.limits.length && <p>No life limits recorded for this component.</p>}
      </>}
    </DialogContent></Dialog>
  </section>;
}
