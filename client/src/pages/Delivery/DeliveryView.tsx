import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, CheckCircle2, ClipboardCheck, FileSignature, PlaneLanding, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { aircraft } from "@/data/aircraft";
import { findings } from "@/data/mock/inspection-presentation";
import { damageFindings } from "@/data/mock/damage-3d";
import { SummaryCardRow } from "@/components/shared/SummaryCardRow";
import { StatusPill, type StatusTone } from "@/components/shared/StatusPill";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ROUTES } from "@/routes";
import { useAuth } from "@/lib/auth";
import { QcChecklistBadge } from "@/pages/QaQc/QcChecklistBadge";
import { fetchDirectives, type ApiDirective } from "@/pages/Compliance/directivesApi";
import {
  createEvent,
  EVENT_STATUS_LABEL,
  EVENT_TYPE_LABEL,
  fetchEvent,
  fetchEvents,
  raiseDiscrepancy,
  resolveDiscrepancy,
  signOffEvent,
  type DeliveryEvent,
  type DeliveryEventDetail,
  type EventStatus,
  type EventType,
} from "./deliveryApi";

const STATUS_TONE: Record<EventStatus, StatusTone> = { in_progress: "amber", discrepancies_open: "red", complete: "green" };
const CHECKLIST_TONE: Record<string, StatusTone> = { in_progress: "amber", passed: "green", failed: "red" };
const CHECKLIST_LABEL: Record<string, string> = { in_progress: "In Progress", passed: "Passed", failed: "Failed" };
const FINDING_OPTIONS = [
  ...findings.map(finding => ({ id: finding.id, label: `${finding.id} · ${finding.title}` })),
  ...damageFindings.map(finding => ({ id: finding.id, label: `${finding.id} · ${finding.title}` })),
];
const dateLabel = (value: string) =>
  new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function DeliveryView() {
  const [events, setEvents] = useState<DeliveryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [directives, setDirectives] = useState<ApiDirective[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({ tail: aircraft[0].tail, eventType: "redelivery" as EventType, counterparty: "", targetDate: "" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DeliveryEventDetail | null>(null);
  const { user } = useAuth();
  const [discrepancyText, setDiscrepancyText] = useState("");
  const [discrepancyDirective, setDiscrepancyDirective] = useState("");
  const [discrepancyFinding, setDiscrepancyFinding] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadEvents = () => {
    setLoading(true);
    return fetchEvents()
      .then(setEvents)
      .catch(err => toast.error(err instanceof Error ? err.message : "Failed to load delivery events."))
      .finally(() => setLoading(false));
  };
  const loadDetail = (id: string) =>
    fetchEvent(id)
      .then(setDetail)
      .catch(err => toast.error(err instanceof Error ? err.message : "Failed to load event."));

  useEffect(() => {
    void loadEvents();
    fetchDirectives().then(setDirectives).catch(() => setDirectives([]));
  }, []);
  useEffect(() => {
    setDetail(null);
    if (selectedId) void loadDetail(selectedId);
  }, [selectedId]);

  const refreshAll = async () => {
    if (selectedId) await loadDetail(selectedId);
    await loadEvents();
    setRefreshKey(key => key + 1);
  };

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      await refreshAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const open = events.filter(event => event.status !== "complete");
  const signOffBlockers = detail
    ? [
        detail.checklistStatus !== "passed" && `records checklist is ${CHECKLIST_LABEL[detail.checklistStatus ?? ""]?.toLowerCase() ?? "missing"}`,
        detail.openDiscrepancies > 0 && `${detail.openDiscrepancies} open discrepanc${detail.openDiscrepancies === 1 ? "y" : "ies"}`,
      ].filter((reason): reason is string => !!reason)
    : [];

  return (
    <section className="delivery-view" aria-label="Aircraft delivery and redelivery">
      <header className="page-heading">
        <div>
          <div className="eyebrow"><PlaneLanding size={13} /> AIRCRAFT / DELIVERY</div>
          <h1>Delivery & Re-Delivery</h1>
          <p>Track aircraft deliveries and lease returns: records completeness, return-condition discrepancies, and final sign-off.</p>
        </div>
        <button className="primary-button" onClick={() => setCreateOpen(true)}><Plus size={14} /> New Event</button>
      </header>
      <SummaryCardRow className="qaqc-summary" cards={[
        { icon: PlaneLanding, label: "Active Events", value: String(open.length), foot: `${events.length} total`, tone: "blue" },
        { icon: ClipboardCheck, label: "Records Checklist Pending", value: String(open.filter(event => event.checklistStatus !== "passed").length), foot: "checklist not yet passed", tone: "amber" },
        { icon: AlertTriangle, label: "Open Discrepancies", value: String(events.reduce((sum, event) => sum + event.openDiscrepancies, 0)), foot: "blocking sign-off", tone: "red" },
        { icon: CheckCircle2, label: "Signed Off", value: String(events.length - open.length), foot: "complete events", tone: "green" },
      ]} />
      <div className="panel delivery-panel">
        <Table aria-label="Delivery events">
          <TableHeader><TableRow><TableHead>Aircraft</TableHead><TableHead>Type</TableHead><TableHead>Counterparty</TableHead><TableHead>Target Date</TableHead><TableHead>Records Checklist</TableHead><TableHead>Open Discrepancies</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {events.map(event => (
              <TableRow key={event.id} data-state={selectedId === event.id ? "selected" : undefined}>
                <TableCell><Link href={ROUTES.aircraftRecord(event.tail)} className="delivery-tail"><strong>{event.tail}</strong></Link><small className="delivery-sub">{aircraft.find(plane => plane.tail === event.tail)?.type}</small></TableCell>
                <TableCell>{EVENT_TYPE_LABEL[event.eventType]}</TableCell>
                <TableCell>{event.counterparty}</TableCell>
                <TableCell>{dateLabel(event.targetDate)}</TableCell>
                <TableCell>{event.checklistStatus ? <StatusPill status={CHECKLIST_LABEL[event.checklistStatus]} tone={CHECKLIST_TONE[event.checklistStatus]} /> : "—"}</TableCell>
                <TableCell>{event.openDiscrepancies}</TableCell>
                <TableCell><StatusPill status={EVENT_STATUS_LABEL[event.status]} tone={STATUS_TONE[event.status]} /></TableCell>
                <TableCell><button className="secondary-button" onClick={() => setSelectedId(event.id)}>Open</button></TableCell>
              </TableRow>
            ))}
            {!events.length && <TableRow><TableCell colSpan={8} className="table-empty">{loading ? "Loading events…" : "No delivery or redelivery events yet."}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="directive-form-dialog">
          <DialogTitle>New delivery event</DialogTitle>
          <DialogDescription>A records-completeness checklist is created with the event automatically.</DialogDescription>
          <form onSubmit={event => {
            event.preventDefault();
            void run(async () => {
              const created = await createEvent(draft);
              setCreateOpen(false);
              setDraft(previous => ({ ...previous, counterparty: "", targetDate: "" }));
              setSelectedId(created.id);
            }, "Delivery event created with its records checklist.");
          }}>
            <div className="directive-form-row">
              <label>Aircraft<select value={draft.tail} onChange={event => setDraft({ ...draft, tail: event.target.value })}>{aircraft.map(plane => <option key={plane.tail} value={plane.tail}>{plane.tail} · {plane.type}</option>)}</select></label>
              <label>Type<select value={draft.eventType} onChange={event => setDraft({ ...draft, eventType: event.target.value as EventType })}><option value="redelivery">Redelivery (lease return)</option><option value="delivery">Delivery (in)</option></select></label>
            </div>
            <div className="directive-form-row">
              <label>Counterparty<input required value={draft.counterparty} onChange={event => setDraft({ ...draft, counterparty: event.target.value })} placeholder="Lessor / lessee" /></label>
              <label>Target date<input required type="date" value={draft.targetDate} onChange={event => setDraft({ ...draft, targetDate: event.target.value })} /></label>
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setCreateOpen(false)}>Cancel</button>
              <button type="submit" className="primary-button" disabled={busy}>Create event</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Drawer direction="right" open={!!selectedId} onOpenChange={next => { if (!next) setSelectedId(null); }}>
        <DrawerContent className="directive-drawer delivery-drawer">
          <DrawerHeader className="directive-drawer-header">
            <DrawerClose className="directive-close" aria-label="Close event details"><X size={18} /></DrawerClose>
            <span className="eyebrow">{detail ? EVENT_TYPE_LABEL[detail.eventType].toUpperCase() : "DELIVERY EVENT"}</span>
            <DrawerTitle>{detail ? `${detail.tail} · ${detail.counterparty}` : "Loading…"}</DrawerTitle>
            <DrawerDescription>{detail && `Target ${dateLabel(detail.targetDate)}`}</DrawerDescription>
            {detail && <div className="directive-badges"><StatusPill status={EVENT_STATUS_LABEL[detail.status]} tone={STATUS_TONE[detail.status]} /></div>}
          </DrawerHeader>
          {detail && (
            <div className="directive-drawer-body delivery-body">
              <p className="delivery-note">Actions are recorded as <strong>{user?.displayName}</strong>.</p>

              <section>
                <h3>Records Checklist</h3>
                <QcChecklistBadge linkedEntityType="delivery" linkedEntityId={detail.id} refreshKey={refreshKey} />
                <p className="delivery-note">Work the checklist item by item on the QA/QC page — it's listed under the Delivery category.</p>
              </section>

              <section>
                <h3>Discrepancy Log</h3>
                <ul className="delivery-discrepancies">
                  {detail.discrepancies.map(discrepancy => (
                    <li key={discrepancy.id} className={discrepancy.status === "resolved" ? "is-resolved" : undefined}>
                      <div>
                        <strong>{discrepancy.description}</strong>
                        <small>
                          Raised by {discrepancy.raisedBy}
                          {discrepancy.linkedDirective && <> · <Link href={ROUTES.compliance}>{discrepancy.linkedDirective.referenceNo}</Link></>}
                          {discrepancy.linkedFindingId && <> · Finding {discrepancy.linkedFindingId}</>}
                          {discrepancy.resolvedBy && <> · resolved by {discrepancy.resolvedBy}</>}
                        </small>
                      </div>
                      {discrepancy.status === "open" ? (
                        <button className="secondary-button" disabled={busy || detail.status === "complete"} onClick={() => void run(() => resolveDiscrepancy(discrepancy.id), "Discrepancy resolved.")}>Resolve</button>
                      ) : (
                        <StatusPill status="Resolved" tone="green" />
                      )}
                    </li>
                  ))}
                  {!detail.discrepancies.length && <li className="delivery-empty">No discrepancies logged.</li>}
                </ul>
                {detail.status !== "complete" && (
                  <form className="delivery-add" onSubmit={event => {
                    event.preventDefault();
                    void run(async () => {
                      await raiseDiscrepancy(detail.id, {
                        description: discrepancyText,
                        linkedComplianceDirectiveId: discrepancyDirective || undefined,
                        linkedFindingId: discrepancyFinding || undefined,
                      });
                      setDiscrepancyText("");
                      setDiscrepancyDirective("");
                      setDiscrepancyFinding("");
                    }, "Discrepancy logged.");
                  }}>
                    <input required value={discrepancyText} onChange={event => setDiscrepancyText(event.target.value)} placeholder="Describe the return-condition discrepancy" />
                    <div className="directive-form-row">
                      <select value={discrepancyDirective} onChange={event => setDiscrepancyDirective(event.target.value)} aria-label="Link a compliance directive">
                        <option value="">Link directive (optional)</option>
                        {directives.map(directive => <option key={directive.id} value={directive.id}>{directive.referenceNo} · {directive.title}</option>)}
                      </select>
                      <select value={discrepancyFinding} onChange={event => setDiscrepancyFinding(event.target.value)} aria-label="Link a finding">
                        <option value="">Link finding (optional)</option>
                        {FINDING_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                      </select>
                    </div>
                    <button type="submit" className="secondary-button" disabled={busy}>Log discrepancy</button>
                  </form>
                )}
              </section>

              <section className="delivery-signoff">
                <h3>Final Sign-off</h3>
                {detail.status === "complete" ? (
                  <p className="delivery-signed"><FileSignature size={14} /> Signed off by <strong>{detail.signedOffBy}</strong> on {dateLabel(detail.signedOffAt!)}</p>
                ) : (
                  <>
                    <p className="delivery-note">
                      {signOffBlockers.length ? `Blocked: ${signOffBlockers.join(" · ")}.` : "Records checklist passed and no open discrepancies — ready for sign-off."}
                    </p>
                    <button className="primary-button" disabled={busy || signOffBlockers.length > 0} onClick={() => void run(() => signOffEvent(detail.id), "Event signed off.")}>
                      <FileSignature size={14} /> Sign off {detail.eventType} as {user?.displayName}
                    </button>
                  </>
                )}
              </section>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </section>
  );
}
