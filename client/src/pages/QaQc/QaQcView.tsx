import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, Clock3, ImagePlus, ListChecks, Play, XCircle } from "lucide-react";
import { toast } from "sonner";
import { aircraft } from "@/data/aircraft";
import { inspections } from "@/data/mock/inspections";
import { partRequests } from "@/data/mock/parts-requests";
import { SummaryCardRow } from "@/components/shared/SummaryCardRow";
import { StatusPill } from "@/components/shared/StatusPill";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { QC_STATUS_TONE } from "./QcChecklistBadge";
import {
  fetchInstances,
  fetchTemplates,
  LINKED_ENTITY_LABEL,
  QC_STATUS_LABEL,
  startInstance,
  submitInstance,
  uploadAttachment,
  type ItemResult,
  type LinkedEntityType,
  type QcInstance,
  type QcResult,
  type QcTemplate,
} from "./qcApi";

const DEFAULT_ENTITY_FOR_CATEGORY: Record<QcTemplate["category"], LinkedEntityType> = {
  inspection: "inspection",
  parts: "part_request",
  delivery: "aircraft",
};

const ENTITY_OPTIONS: Record<Exclude<LinkedEntityType, "delivery">, { id: string; label: string }[]> = {
  inspection: inspections.map(row => ({ id: row.id, label: `${row.id} · ${row.tail} · ${row.checkType}` })),
  part_request: partRequests.map(row => ({ id: row.id, label: `${row.id} · ${row.partName}` })),
  aircraft: aircraft.map(row => ({ id: row.tail, label: `${row.tail} · ${row.type}` })),
};

const RESULT_OPTIONS: { value: ItemResult; label: string }[] = [
  { value: "pass", label: "Pass" },
  { value: "fail", label: "Fail" },
  { value: "na", label: "N/A" },
];

/** Delivery events are keyed by UUID; show a short prefix instead. */
const shortId = (id: string) => (id.length > 20 ? id.slice(0, 8) : id);

const dateLabel = (value: string | null) =>
  value ? new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

export function QaQcView() {
  const [templates, setTemplates] = useState<QcTemplate[]>([]);
  const [instances, setInstances] = useState<QcInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [startOpen, setStartOpen] = useState(false);
  const [startTemplateId, setStartTemplateId] = useState("");
  const [startEntityType, setStartEntityType] = useState<Exclude<LinkedEntityType, "delivery">>("inspection");
  const [startEntityId, setStartEntityId] = useState("");

  const [running, setRunning] = useState<QcInstance | null>(null);
  const [draft, setDraft] = useState<Record<string, Partial<QcResult>>>({});
  const [completedBy, setCompletedBy] = useState("");
  const [uploadingItem, setUploadingItem] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([fetchTemplates(), fetchInstances()])
      .then(([nextTemplates, nextInstances]) => {
        setTemplates(nextTemplates);
        setInstances(nextInstances);
      })
      .catch(err => toast.error(err instanceof Error ? err.message : "Failed to load QA/QC data."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const templateById = useMemo(() => new Map(templates.map(template => [template.id, template])), [templates]);
  const visible = instances.filter(
    instance =>
      (statusFilter === "all" || instance.status === statusFilter) &&
      (categoryFilter === "all" || templateById.get(instance.templateId)?.category === categoryFilter),
  );
  const count = (status: QcInstance["status"]) => instances.filter(instance => instance.status === status).length;
  const runningTemplate = running ? templateById.get(running.templateId) : undefined;
  const readOnly = running?.status !== "in_progress";

  const openStart = () => {
    const first = templates.find(template => template.category !== "delivery") ?? templates[0];
    const entityType = first ? (DEFAULT_ENTITY_FOR_CATEGORY[first.category] as Exclude<LinkedEntityType, "delivery">) : "inspection";
    setStartTemplateId(first?.id ?? "");
    setStartEntityType(entityType);
    setStartEntityId(ENTITY_OPTIONS[entityType][0]?.id ?? "");
    setStartOpen(true);
  };

  const openRun = (instance: QcInstance) => {
    setRunning(instance);
    setDraft(Object.fromEntries(instance.results.map(result => [result.itemId, result])));
    setCompletedBy(instance.completedBy ?? "");
  };

  const submitStart = async () => {
    try {
      const created = await startInstance({ templateId: startTemplateId, linkedEntityType: startEntityType, linkedEntityId: startEntityId });
      toast.success("Checklist started.");
      setStartOpen(false);
      load();
      openRun(created);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start checklist.");
    }
  };

  // An item's result stays unset until the technician picks one — typing a
  // note first must not silently default the item to "pass".
  const setItem = (itemId: string, patch: Partial<QcResult>) =>
    setDraft(previous => ({ ...previous, [itemId]: { ...previous[itemId], ...patch, itemId } }));

  const attachPhoto = async (itemId: string, file: File | undefined) => {
    if (!file) return;
    setUploadingItem(itemId);
    try {
      const { url } = await uploadAttachment(file);
      setItem(itemId, { photoUrl: url });
      toast.success("Photo attached.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingItem(null);
    }
  };

  const submitRun = async () => {
    if (!running || !runningTemplate) return;
    setSubmitting(true);
    try {
      const results = runningTemplate.items
        .map(item => draft[item.id])
        .filter((result): result is QcResult => !!result?.result);
      const updated = await submitInstance(running.id, { results, completedBy });
      toast[updated.status === "passed" ? "success" : "warning"](`Checklist ${QC_STATUS_LABEL[updated.status].toLowerCase()}.`, {
        description: updated.status === "failed" ? "One or more items failed — see notes." : undefined,
      });
      setRunning(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit checklist.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="qaqc-view" aria-label="QA/QC checklists">
      <header className="page-heading">
        <div>
          <div className="eyebrow"><ListChecks size={13} /> PROCUREMENT / QUALITY</div>
          <h1>QA / QC</h1>
          <p>Work through quality checklists for inspections, incoming parts, and aircraft deliveries.</p>
        </div>
        <button className="primary-button" onClick={openStart} disabled={!templates.length}><Play size={14} /> Start Checklist</button>
      </header>
      <SummaryCardRow className="qaqc-summary" cards={[
        { icon: ClipboardList, label: "Templates", value: String(templates.length), foot: "inspection · parts · delivery", tone: "blue" },
        { icon: Clock3, label: "In Progress", value: String(count("in_progress")), foot: "awaiting technician sign-off", tone: "amber" },
        { icon: CheckCircle2, label: "Passed", value: String(count("passed")), foot: "all items pass or N/A", tone: "green" },
        { icon: XCircle, label: "Failed", value: String(count("failed")), foot: "one or more items failed", tone: "red" },
      ]} />
      <div className="qaqc-layout">
        <div className="panel qaqc-panel">
          <div className="qaqc-filters">
            <label>Status<select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">All Statuses</option><option value="in_progress">In Progress</option><option value="passed">Passed</option><option value="failed">Failed</option></select></label>
            <label>Category<select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}><option value="all">All Categories</option><option value="inspection">Inspection</option><option value="parts">Parts</option><option value="delivery">Delivery</option></select></label>
          </div>
          <Table aria-label="QA/QC checklist instances">
            <TableHeader><TableRow><TableHead>Checklist</TableHead><TableHead>Linked Record</TableHead><TableHead>Status</TableHead><TableHead>Completed By</TableHead><TableHead>Completed</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {visible.map(instance => (
                <TableRow key={instance.id}>
                  <TableCell><strong>{templateById.get(instance.templateId)?.name ?? "Unknown template"}</strong></TableCell>
                  <TableCell>{LINKED_ENTITY_LABEL[instance.linkedEntityType]} · {shortId(instance.linkedEntityId)}</TableCell>
                  <TableCell><StatusPill status={QC_STATUS_LABEL[instance.status]} tone={QC_STATUS_TONE[instance.status]} /></TableCell>
                  <TableCell>{instance.completedBy ?? "—"}</TableCell>
                  <TableCell>{dateLabel(instance.completedAt)}</TableCell>
                  <TableCell><button className="secondary-button" onClick={() => openRun(instance)}>{instance.status === "in_progress" ? "Continue" : "View"}</button></TableCell>
                </TableRow>
              ))}
              {!visible.length && <TableRow><TableCell colSpan={6} className="table-empty">{loading ? "Loading checklists…" : "No checklists yet — start one to begin."}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
        <aside className="panel qaqc-templates">
          <h2>Templates</h2>
          <ul>
            {templates.map(template => (
              <li key={template.id}>
                <strong>{template.name}</strong>
                <small>{template.category} · {template.items.length} items · {template.items.filter(item => item.requiresPhoto).length} require photo</small>
              </li>
            ))}
          </ul>
          <p className="qaqc-note">Template authoring is Wave 2 (Templates module) — these are seeded.</p>
        </aside>
      </div>

      <Dialog open={startOpen} onOpenChange={setStartOpen}>
        <DialogContent className="directive-form-dialog">
          <DialogTitle>Start a checklist</DialogTitle>
          <DialogDescription>Pick a template and the record it applies to.</DialogDescription>
          <form onSubmit={event => { event.preventDefault(); void submitStart(); }}>
            <label>
              Template
              <select value={startTemplateId} onChange={event => {
                const template = templateById.get(event.target.value);
                setStartTemplateId(event.target.value);
                if (template) {
                  const entityType = DEFAULT_ENTITY_FOR_CATEGORY[template.category] as Exclude<LinkedEntityType, "delivery">;
                  setStartEntityType(entityType);
                  setStartEntityId(ENTITY_OPTIONS[entityType][0]?.id ?? "");
                }
              }}>
                {templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}
              </select>
            </label>
            <div className="directive-form-row">
              <label>
                Applies to
                <select value={startEntityType} onChange={event => {
                  const next = event.target.value as Exclude<LinkedEntityType, "delivery">;
                  setStartEntityType(next);
                  setStartEntityId(ENTITY_OPTIONS[next][0]?.id ?? "");
                }}>
                  <option value="inspection">Inspection</option>
                  <option value="part_request">Part Request</option>
                  <option value="aircraft">Aircraft</option>
                </select>
              </label>
              <label>
                Record
                <select value={startEntityId} onChange={event => setStartEntityId(event.target.value)}>
                  {ENTITY_OPTIONS[startEntityType].map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setStartOpen(false)}>Cancel</button>
              <button type="submit" className="primary-button" disabled={!startTemplateId || !startEntityId}>Start</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!running} onOpenChange={next => { if (!next) setRunning(null); }}>
        <DialogContent className="directive-form-dialog qaqc-run-dialog">
          <DialogTitle>{runningTemplate?.name ?? "Checklist"}</DialogTitle>
          <DialogDescription>
            {running && `${LINKED_ENTITY_LABEL[running.linkedEntityType]} · ${shortId(running.linkedEntityId)} · `}
            {running && <StatusPill status={QC_STATUS_LABEL[running.status]} tone={QC_STATUS_TONE[running.status]} />}
          </DialogDescription>
          <form onSubmit={event => { event.preventDefault(); void submitRun(); }}>
            <ol className="qaqc-items">
              {runningTemplate?.items.map(item => {
                const current = draft[item.id];
                return (
                  <li key={item.id} className={current?.result === "fail" ? "qaqc-item-failed" : undefined}>
                    <div className="qaqc-item-head">
                      <span>{item.label}{item.requiresPhoto && <em> · photo required</em>}</span>
                      <div className="qaqc-result-toggle" role="radiogroup" aria-label={`Result for ${item.label}`}>
                        {RESULT_OPTIONS.map(option => (
                          <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={current?.result === option.value}
                            className={current?.result === option.value ? `active result-${option.value}` : undefined}
                            disabled={readOnly}
                            onClick={() => setItem(item.id, { result: option.value })}
                          >{option.label}</button>
                        ))}
                      </div>
                    </div>
                    <div className="qaqc-item-extra">
                      <input
                        placeholder="Notes"
                        value={current?.notes ?? ""}
                        disabled={readOnly}
                        onChange={event => setItem(item.id, { notes: event.target.value })}
                      />
                      {current?.photoUrl ? (
                        <a href={current.photoUrl} target="_blank" rel="noreferrer" className="qaqc-photo-link">Photo attached</a>
                      ) : (
                        !readOnly && (
                          <label className="qaqc-photo-upload">
                            <ImagePlus size={13} /> {uploadingItem === item.id ? "Uploading…" : "Attach photo"}
                            <input type="file" accept="image/*" hidden onChange={event => void attachPhoto(item.id, event.target.files?.[0])} />
                          </label>
                        )
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
            <label>
              Completed by
              <input value={completedBy} disabled={readOnly} onChange={event => setCompletedBy(event.target.value)} placeholder="Technician name" />
            </label>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setRunning(null)}>{readOnly ? "Close" : "Cancel"}</button>
              {!readOnly && <button type="submit" className="primary-button" disabled={submitting || !completedBy.trim()}>{submitting ? "Submitting…" : "Submit checklist"}</button>}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
