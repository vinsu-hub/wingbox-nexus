import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, BookOpen, Check, CheckCircle2, Clock3, FileText, Plus, Search, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { aircraft } from "@/data/aircraft";
import type { Directive } from "@/data/mock/compliance";
import { SummaryCardRow } from "@/components/shared/SummaryCardRow";
import { StatusPill } from "@/components/shared/StatusPill";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DirectiveForm } from "./DirectiveForm";
import { fetchDirectives, markCompliance, toDirectiveWithAffected, type ApiDirective } from "./directivesApi";

type Status = Directive["affected"][number]["status"];
const statuses: Status[] = ["Overdue", "Due Soon", "Compliant", "N/A"];
const titleOf = (directive: Directive) => directive.description.split(". ")[0];
const dateLabel = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function ComplianceView({ tailNumber }: { tailNumber?: string }) {
  const [query, setQuery] = useState("");
  const [aircraftFilter, setAircraftFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selected, setSelected] = useState<Directive | null>(null);
  const [open, setOpen] = useState(false);
  const [reviewed, setReviewed] = useState<Set<string>>(() => new Set());
  const [apiDirectives, setApiDirectives] = useState<ApiDirective[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [markingTail, setMarkingTail] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  const loadDirectives = () => {
    setLoading(true);
    fetchDirectives()
      .then(setApiDirectives)
      .catch(err => toast.error(err instanceof Error ? err.message : "Failed to load directives."))
      .finally(() => setLoading(false));
  };
  useEffect(loadDirectives, []);

  const allTails = aircraft.map(item => item.tail);
  const directives: Directive[] = apiDirectives.map(api => toDirectiveWithAffected(api, allTails));
  const fleet = aircraft.filter(item => tailNumber ? item.tail === tailNumber : aircraftFilter === "all" || item.tail === aircraftFilter);
  const tails = new Set(fleet.map(item => item.tail));
  const scoped = directives.filter(directive => directive.affected.some(item => tails.has(item.tail)));
  const statusOf = (directive: Directive): Status => statuses.find(status => directive.affected.some(item => tails.has(item.tail) && item.status === status)) ?? "N/A";
  const counts = (status: Status) => scoped.filter(directive => statusOf(directive) === status).length;
  const percent = (status: Status) => `${scoped.length ? (counts(status) / scoped.length * 100).toFixed(1) : "0.0"}% of total`;
  const visible = scoped.filter(directive =>
    `${directive.adSbNumber} ${directive.description} ${directive.authority}`.toLowerCase().includes(query.toLowerCase()) &&
    (statusFilter === "all" || statusOf(directive) === statusFilter) &&
    (typeFilter === "all" || directive.adSbNumber.startsWith(typeFilter))
  );
  const showDirective = (directive: Directive) => { setSelected(directive); setOpen(true); };

  const [markStatus, setMarkStatus] = useState<Status>("Compliant");
  const [markCompliedDate, setMarkCompliedDate] = useState("");
  const [markCompliedBy, setMarkCompliedBy] = useState("");
  const [markSignedOffBy, setMarkSignedOffBy] = useState("");
  const [markSubmitting, setMarkSubmitting] = useState(false);

  const submitMarkCompliance = async () => {
    if (!selected || !markingTail) return;
    setMarkSubmitting(true);
    try {
      const result = await markCompliance(selected.id, {
        tailNumber: markingTail,
        status: markStatus,
        compliedDate: markCompliedDate || undefined,
        compliedBy: markCompliedBy || undefined,
        signedOffBy: markSignedOffBy || undefined,
        actor: markCompliedBy || "Engineer",
      });
      if (result.warning) toast.warning(result.warning);
      toast.success(`${markingTail} marked ${markStatus} for ${selected.adSbNumber}.`);
      const refreshed = await fetchDirectives();
      setApiDirectives(refreshed);
      const updatedSelected = refreshed.find(api => api.id === selected.id);
      if (updatedSelected) setSelected(toDirectiveWithAffected(updatedSelected, allTails));
      setMarkingTail(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update compliance status.");
    } finally {
      setMarkSubmitting(false);
    }
  };

  return (
    <section className="compliance-view" aria-label="Compliance tracking">
      <header className="page-heading">
        <div>
          {!tailNumber && <div className="eyebrow"><ShieldCheck size={13} /> AIRCRAFT / COMPLIANCE</div>}
          {tailNumber ? <h2>Compliance · {tailNumber}</h2> : <h1>Compliance</h1>}
          <p>Track ADs, SBs, and regulatory directives {tailNumber ? "for this aircraft" : "across your fleet"}.</p>
        </div>
        <div className="compliance-header-actions">
          <Badge variant="outline" className="compliance-demo-badge">Persisted in Supabase · seeded demo data</Badge>
          {!tailNumber && <button className="primary-button" onClick={() => setFormOpen(true)}><Plus size={14} /> New Directive</button>}
        </div>
      </header>
      {loading && <p className="compliance-loading">Loading directives…</p>}
      <SummaryCardRow className="compliance-summary" cards={[
        { icon: FileText, label: "Total Directives", value: String(scoped.length), foot: `${fleet.length} aircraft in scope`, tone: "blue" },
        { icon: CheckCircle2, label: "Compliant", value: String(counts("Compliant")), foot: percent("Compliant"), tone: "green" },
        { icon: Clock3, label: "Due Soon", value: String(counts("Due Soon")), foot: percent("Due Soon"), tone: "amber" },
        { icon: AlertTriangle, label: "Overdue", value: String(counts("Overdue")), foot: percent("Overdue"), tone: "red" },
      ]} />
      <div className="panel compliance-panel">
        <div className="compliance-filters">
          <label className="compliance-search"><Search size={15} /><input aria-label="Search directives" placeholder="Search AD/SB number, title, or description…" value={query} onChange={event => setQuery(event.target.value)} /></label>
          {!tailNumber && <label>Aircraft<select value={aircraftFilter} onChange={event => setAircraftFilter(event.target.value)}><option value="all">All Aircraft</option>{aircraft.map(item => <option key={item.tail}>{item.tail}</option>)}</select></label>}
          <label>Status<select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">All Statuses</option>{statuses.map(status => <option key={status}>{status}</option>)}</select></label>
          <label>Directive Type<select value={typeFilter} onChange={event => setTypeFilter(event.target.value)}><option value="all">All Types</option><option value="AD">Airworthiness Directive</option><option value="SB">Service Bulletin</option></select></label>
        </div>
        <div className="compliance-matrix-heading"><h2>{tailNumber ? "Aircraft Compliance Matrix" : "Fleet Compliance Matrix"}</h2><span>Select a directive to view details</span></div>
        <Table className="compliance-matrix" aria-label="Directive compliance by aircraft">
          <TableHeader><TableRow><TableHead scope="col" className="compliance-directive-column">AD / SB Number · Title</TableHead>{fleet.map(item => <TableHead scope="col" key={item.tail}>{item.tail}<small>{item.type}</small></TableHead>)}<TableHead scope="col">Overall Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {visible.map(directive => <motion.tr key={directive.id} whileHover={reduceMotion ? undefined : { y: -2 }} transition={{ duration: 0.15 }} onClick={() => showDirective(directive)} data-state={open && selected?.id === directive.id ? "selected" : undefined}>
              <TableCell className="compliance-directive-column"><button className="compliance-directive-button" onClick={event => { event.stopPropagation(); showDirective(directive); }} aria-label={`View ${directive.adSbNumber}: ${titleOf(directive)}`}><strong>{directive.adSbNumber}<Badge variant="outline">{directive.adSbNumber.startsWith("AD") ? "AD" : "SB"}</Badge></strong><span>{titleOf(directive)}</span></button></TableCell>
              {fleet.map(item => <TableCell key={item.tail}><StatusPill status={directive.affected.find(affected => affected.tail === item.tail)?.status ?? "N/A"} /></TableCell>)}
              <TableCell><StatusPill status={statusOf(directive)} /></TableCell>
            </motion.tr>)}
            {!visible.length && <TableRow><TableCell colSpan={fleet.length + 2} className="table-empty">{fleet.length ? "No directives match your filters." : `No aircraft found for ${tailNumber}.`}</TableCell></TableRow>}
          </TableBody>
        </Table>
        <footer className="compliance-matrix-footer"><span>Showing {visible.length} of {scoped.length} directives</span><span>Overall status uses the most urgent status in scope. N/A means not applicable.</span></footer>
      </div>
      <Drawer direction="right" open={open} onOpenChange={setOpen}>
        <DrawerContent className="directive-drawer">
          {selected && <>
            <DrawerHeader className="directive-drawer-header">
              <DrawerClose className="directive-close" aria-label="Close directive details"><X size={18} /></DrawerClose>
              <span className="eyebrow">DIRECTIVE DETAILS</span>
              <DrawerTitle>{selected.adSbNumber}</DrawerTitle>
              <DrawerDescription>{titleOf(selected)}</DrawerDescription>
              <div className="directive-badges"><StatusPill status={statusOf(selected)} />{reviewed.has(selected.id) && <Badge variant="outline" className="directive-reviewed"><Check size={12} /> Reviewed by You</Badge>}</div>
            </DrawerHeader>
            <div className="directive-drawer-body">
              <section className="directive-details"><h3>Directive Details</h3><dl><div><dt>Issuing Authority</dt><dd>{selected.authority}</dd></div><div><dt>Issue Date</dt><dd>{dateLabel(selected.issueDate)}</dd></div><div><dt>Compliance Deadline</dt><dd>{dateLabel(selected.deadline)}</dd></div><div><dt>AMM Section Reference</dt><dd>{selected.ammSection}</dd></div></dl><h4>Description</h4><p>{selected.description}</p></section>
              <section className="directive-aircraft"><h3>Affected Aircraft</h3><p className="directive-scope">{tailNumber ? `Showing ${tailNumber}` : aircraftFilter !== "all" ? `Showing ${aircraftFilter}` : "All fleet aircraft"} · N/A aircraft shown for context</p><ul>{selected.affected.filter(item => tails.has(item.tail)).map((item, index) => <motion.li key={`${selected.id}-${item.tail}`} initial={reduceMotion ? false : { opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: reduceMotion ? 0 : index * 0.025 }}><div><strong>{item.tail}</strong><small>{aircraft.find(plane => plane.tail === item.tail)?.type}</small></div><div className="directive-aircraft-actions"><StatusPill status={item.status} />{item.status !== "N/A" && <button className="directive-mark-button" onClick={() => { setMarkingTail(item.tail); setMarkStatus(item.status); setMarkCompliedDate(""); setMarkCompliedBy(""); setMarkSignedOffBy(""); }}>Update</button>}</div></motion.li>)}</ul></section>
            </div>
            <DrawerFooter className="directive-drawer-footer"><button className="primary-button" onClick={() => toast.info(`Knowledge Base preview for ${selected.adSbNumber} is not connected yet.`)}><BookOpen size={14} /> View in Knowledge Base</button><button className="secondary-button" disabled={reviewed.has(selected.id)} onClick={() => { setReviewed(previous => new Set(previous).add(selected.id)); toast.success("Review acknowledged for this session. Compliance status is unchanged."); }}><Check size={14} />{reviewed.has(selected.id) ? "Reviewed by You" : "Mark as Reviewed"}</button><p>Review acknowledgment is stored for this session only.</p></DrawerFooter>
          </>}
        </DrawerContent>
      </Drawer>
      <DirectiveForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={() => { setFormOpen(false); loadDirectives(); }}
      />
      <Dialog open={!!markingTail} onOpenChange={next => { if (!next) setMarkingTail(null); }}>
        <DialogContent className="directive-form-dialog">
          <DialogTitle>Update compliance status</DialogTitle>
          <DialogDescription>{markingTail} · {selected?.adSbNumber}</DialogDescription>
          <form onSubmit={event => { event.preventDefault(); void submitMarkCompliance(); }}>
            <label>
              Status
              <select value={markStatus} onChange={event => setMarkStatus(event.target.value as Status)}>
                {statuses.filter(status => status !== "N/A").map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <div className="directive-form-row">
              <label>
                Complied by
                <input value={markCompliedBy} onChange={event => setMarkCompliedBy(event.target.value)} placeholder="Engineer name" />
              </label>
              <label>
                Signed off by
                <input value={markSignedOffBy} onChange={event => setMarkSignedOffBy(event.target.value)} placeholder="Authorizing engineer" />
              </label>
            </div>
            <label>
              Complied date
              <input type="date" value={markCompliedDate} onChange={event => setMarkCompliedDate(event.target.value)} />
            </label>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setMarkingTail(null)}>Cancel</button>
              <button type="submit" className="primary-button" disabled={markSubmitting}>{markSubmitting ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
