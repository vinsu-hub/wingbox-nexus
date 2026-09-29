import { DemoDataBadge } from "@/components/DemoDataBadge";
import { useState } from "react";
import { FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { demoTemplates, type DemoTemplate } from "@/data/mock/templates";
import { FilterableTable } from "@/components/shared/FilterableTable";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { AdminCount, AdminHeading, prettyDate } from "./AdminShared";

export function TemplatesPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [selected, setSelected] = useState<DemoTemplate | null>(null);
  const visible = demoTemplates.filter(item => `${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase()) && (type === "all" || item.type === type));
  return <section className="admin-page"><DemoDataBadge variant="page" /><AdminHeading title="Templates" description="Explore standard checklists and report structures used across the fleet." action={<button className="primary-button" onClick={() => toast.info("Template authoring is not connected yet.", { description: "No template was created." })}><Plus size={15} /> Create Template</button>} />
    <div className="admin-counts"><AdminCount value={demoTemplates.length} label="Templates" detail="in demo library" /><AdminCount value={demoTemplates.filter(item => item.type === "QC Checklist").length} label="QC checklists" detail="quality workflows" /><AdminCount value={demoTemplates.reduce((total, item) => total + item.usage, 0)} label="Uses" detail="sample activity" /></div>
    <div className="panel admin-table"><div className="admin-section-title"><div><FileText size={18} /><h2>Template library</h2></div><span>{visible.length} templates</span></div><FilterableTable rows={visible} getRowId={item => item.id} searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search templates…" filters={<select aria-label="Filter by template type" value={type} onChange={event => setType(event.target.value)}><option value="all">All types</option><option>QC Checklist</option><option>Report Format</option><option>Delivery Checklist</option></select>} columns={[{ key: "name", header: "Template", render: item => <><strong className="admin-primary-cell">{item.name}</strong><small>{item.id}</small></> }, { key: "type", header: "Type", render: item => <span className="admin-role">{item.type}</span> }, { key: "category", header: "Category", render: item => item.category }, { key: "modified", header: "Last modified", render: item => prettyDate(item.modified) }, { key: "usage", header: "Uses", render: item => item.usage }, { key: "action", header: "", render: item => <button className="admin-link" onClick={() => setSelected(item)}>Preview</button> }]} /></div>
    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="admin-dialog"><DialogTitle>{selected?.name}</DialogTitle><DialogDescription>{selected?.type} · {selected?.category} · {selected?.id}</DialogDescription><p className="admin-preview-description">{selected?.description}</p><div className="admin-detail-grid"><span>Maintained by</span><strong>{selected?.owner}</strong><span>Last modified</span><strong>{prettyDate(selected?.modified ?? null)}</strong><span>Sample uses</span><strong>{selected?.usage}</strong></div><h3>Preview sections</h3><ol className="admin-preview-list">{selected?.sections.map(section => <li key={section}>{section}</li>)}</ol><p className="admin-session-copy">Preview of sample structure. Template authoring is not connected.</p></DialogContent></Dialog>
  </section>;
}
