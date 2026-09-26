import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { recordAuditEvent } from "../lib/auditLog.js";
import { QC_INSTANCES_TABLE, QC_TEMPLATES_TABLE } from "./qcChecklists.js";

export const DELIVERY_EVENTS_TABLE = "delivery_events";
export const DISCREPANCIES_TABLE = "delivery_discrepancies";

export const deliveryRouter = Router();

const createEventSchema = z.object({
  tail: z.string().min(1),
  eventType: z.enum(["delivery", "redelivery"]),
  counterparty: z.string().min(1),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD"),
  actor: z.string().min(1),
});

const discrepancySchema = z.object({
  description: z.string().min(1),
  linkedComplianceDirectiveId: z.string().uuid().optional(),
  linkedFindingId: z.string().min(1).optional(),
  actor: z.string().min(1),
});

const resolveSchema = z.object({ actor: z.string().min(1) });
const signOffSchema = z.object({ signedOffBy: z.string().min(1) });

type EventStatus = "in_progress" | "discrepancies_open" | "complete";

interface EventRow {
  id: string;
  aircraft_tail: string;
  event_type: "delivery" | "redelivery";
  counterparty: string;
  target_date: string;
  status: EventStatus;
  qc_checklist_instance_id: string | null;
  signed_off_by: string | null;
  signed_off_at: string | null;
  created_at: string;
}

interface DiscrepancyRow {
  id: string;
  delivery_event_id: string;
  description: string;
  linked_compliance_directive_id: string | null;
  linked_finding_id: string | null;
  status: "open" | "resolved";
  raised_by: string;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  directives?: { reference_no: string; title: string } | null;
}

const zodError = (error: z.ZodError) => error.issues.map(issue => `${issue.path.join(".") || "body"}: ${issue.message}`).join("; ");

/** The single place event status is decided — clients can't set it. */
function deriveStatus(event: Pick<EventRow, "signed_off_at">, discrepancies: Pick<DiscrepancyRow, "status">[]): EventStatus {
  if (event.signed_off_at) return "complete";
  if (discrepancies.some(discrepancy => discrepancy.status === "open")) return "discrepancies_open";
  return "in_progress";
}

async function syncStatus(eventId: string): Promise<EventStatus> {
  const [{ data: event, error: eventError }, { data: discrepancies, error: discError }] = await Promise.all([
    supabase.from(DELIVERY_EVENTS_TABLE).select("signed_off_at").eq("id", eventId).single(),
    supabase.from(DISCREPANCIES_TABLE).select("status").eq("delivery_event_id", eventId),
  ]);
  if (eventError || discError) throw new Error(`Status sync failed: ${(eventError ?? discError)!.message}`);
  const status = deriveStatus(event, discrepancies ?? []);
  const { error } = await supabase.from(DELIVERY_EVENTS_TABLE).update({ status }).eq("id", eventId);
  if (error) throw new Error(`Status sync failed: ${error.message}`);
  return status;
}

async function checklistStatuses(instanceIds: string[]) {
  if (!instanceIds.length) return new Map<string, string>();
  const { data, error } = await supabase.from(QC_INSTANCES_TABLE).select("id, status").in("id", instanceIds);
  if (error) throw new Error(`Checklist lookup failed: ${error.message}`);
  return new Map((data ?? []).map(row => [row.id as string, row.status as string]));
}

const fromEvent = (row: EventRow, checklistStatus: string | null, openDiscrepancies: number) => ({
  id: row.id,
  tail: row.aircraft_tail,
  eventType: row.event_type,
  counterparty: row.counterparty,
  targetDate: row.target_date,
  status: row.status,
  checklistInstanceId: row.qc_checklist_instance_id,
  checklistStatus,
  openDiscrepancies,
  signedOffBy: row.signed_off_by,
  signedOffAt: row.signed_off_at,
  createdAt: row.created_at,
});

const fromDiscrepancy = (row: DiscrepancyRow) => ({
  id: row.id,
  description: row.description,
  linkedComplianceDirectiveId: row.linked_compliance_directive_id,
  linkedDirective: row.directives ? { referenceNo: row.directives.reference_no, title: row.directives.title } : null,
  linkedFindingId: row.linked_finding_id,
  status: row.status,
  raisedBy: row.raised_by,
  resolvedBy: row.resolved_by,
  resolvedAt: row.resolved_at,
  createdAt: row.created_at,
});

deliveryRouter.get("/events", async (req, res) => {
  try {
    let query = supabase.from(DELIVERY_EVENTS_TABLE).select("*, delivery_discrepancies(status)").order("target_date");
    if (typeof req.query.tail === "string") query = query.eq("aircraft_tail", req.query.tail);
    const { data, error } = await query;
    if (error) {
      res.status(502).json({ error: `Lookup failed: ${error.message}` });
      return;
    }
    const rows = data as (EventRow & { delivery_discrepancies: { status: string }[] })[];
    const statuses = await checklistStatuses(rows.map(row => row.qc_checklist_instance_id).filter((id): id is string => !!id));
    res.json(
      rows.map(row =>
        fromEvent(
          row,
          row.qc_checklist_instance_id ? statuses.get(row.qc_checklist_instance_id) ?? null : null,
          row.delivery_discrepancies.filter(discrepancy => discrepancy.status === "open").length,
        ),
      ),
    );
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown lookup error" });
  }
});

deliveryRouter.get("/events/:id", async (req, res) => {
  try {
    const { data: event, error } = await supabase.from(DELIVERY_EVENTS_TABLE).select("*").eq("id", req.params.id).maybeSingle();
    if (error) {
      res.status(502).json({ error: `Lookup failed: ${error.message}` });
      return;
    }
    if (!event) {
      res.status(404).json({ error: "Delivery event not found." });
      return;
    }
    const { data: discrepancies, error: discError } = await supabase
      .from(DISCREPANCIES_TABLE)
      .select("*, directives(reference_no, title)")
      .eq("delivery_event_id", req.params.id)
      .order("created_at");
    if (discError) {
      res.status(502).json({ error: `Lookup failed: ${discError.message}` });
      return;
    }
    const statuses = await checklistStatuses(event.qc_checklist_instance_id ? [event.qc_checklist_instance_id] : []);
    const discrepancyRows = (discrepancies ?? []) as DiscrepancyRow[];
    res.json({
      ...fromEvent(
        event as EventRow,
        event.qc_checklist_instance_id ? statuses.get(event.qc_checklist_instance_id) ?? null : null,
        discrepancyRows.filter(discrepancy => discrepancy.status === "open").length,
      ),
      discrepancies: discrepancyRows.map(fromDiscrepancy),
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown lookup error" });
  }
});

/** Creates the event and its records-completeness checklist together, from
 * the first 'delivery' QA/QC template. If the checklist can't be created the
 * event is rolled back, so an event never exists without its checklist. */
deliveryRouter.post("/events", async (req, res) => {
  const parsed = createEventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: zodError(parsed.error) });
    return;
  }
  try {
    const { data: template, error: templateError } = await supabase
      .from(QC_TEMPLATES_TABLE)
      .select("id")
      .eq("category", "delivery")
      .order("created_at")
      .limit(1)
      .maybeSingle();
    if (templateError) {
      res.status(502).json({ error: `Template lookup failed: ${templateError.message}` });
      return;
    }
    if (!template) {
      res.status(409).json({ error: "No 'delivery' QA/QC checklist template exists — create one first." });
      return;
    }

    const { data: event, error: eventError } = await supabase
      .from(DELIVERY_EVENTS_TABLE)
      .insert({
        aircraft_tail: parsed.data.tail,
        event_type: parsed.data.eventType,
        counterparty: parsed.data.counterparty,
        target_date: parsed.data.targetDate,
      })
      .select()
      .single();
    if (eventError) {
      res.status(502).json({ error: `Insert failed: ${eventError.message}` });
      return;
    }

    const { data: instance, error: instanceError } = await supabase
      .from(QC_INSTANCES_TABLE)
      .insert({ template_id: template.id, linked_entity_type: "delivery", linked_entity_id: event.id })
      .select("id, status")
      .single();
    if (instanceError) {
      await supabase.from(DELIVERY_EVENTS_TABLE).delete().eq("id", event.id);
      res.status(502).json({ error: `Checklist creation failed, event not created: ${instanceError.message}` });
      return;
    }

    const { data: linked, error: linkError } = await supabase
      .from(DELIVERY_EVENTS_TABLE)
      .update({ qc_checklist_instance_id: instance.id })
      .eq("id", event.id)
      .select()
      .single();
    if (linkError) {
      res.status(502).json({ error: `Checklist link failed: ${linkError.message}` });
      return;
    }

    await recordAuditEvent({
      actor: parsed.data.actor,
      action: "delivery_event.create",
      entityType: "delivery_event",
      entityId: event.id,
      afterState: linked,
    });
    res.status(201).json(fromEvent(linked as EventRow, instance.status, 0));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown insert error" });
  }
});

deliveryRouter.post("/events/:id/discrepancies", async (req, res) => {
  const parsed = discrepancySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: zodError(parsed.error) });
    return;
  }
  try {
    const { data: event } = await supabase.from(DELIVERY_EVENTS_TABLE).select("status").eq("id", req.params.id).maybeSingle();
    if (!event) {
      res.status(404).json({ error: "Delivery event not found." });
      return;
    }
    if (event.status === "complete") {
      res.status(409).json({ error: "Event is already signed off." });
      return;
    }
    const { data: row, error } = await supabase
      .from(DISCREPANCIES_TABLE)
      .insert({
        delivery_event_id: req.params.id,
        description: parsed.data.description,
        linked_compliance_directive_id: parsed.data.linkedComplianceDirectiveId ?? null,
        linked_finding_id: parsed.data.linkedFindingId ?? null,
        raised_by: parsed.data.actor,
      })
      .select("*, directives(reference_no, title)")
      .single();
    if (error) {
      res.status(502).json({ error: `Insert failed: ${error.message}` });
      return;
    }
    const status = await syncStatus(req.params.id);
    await recordAuditEvent({
      actor: parsed.data.actor,
      action: "delivery_discrepancy.raise",
      entityType: "delivery_discrepancy",
      entityId: row.id,
      afterState: row,
    });
    res.status(201).json({ discrepancy: fromDiscrepancy(row as DiscrepancyRow), eventStatus: status });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown insert error" });
  }
});

deliveryRouter.patch("/discrepancies/:id/resolve", async (req, res) => {
  const parsed = resolveSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: zodError(parsed.error) });
    return;
  }
  try {
    const { data: before } = await supabase.from(DISCREPANCIES_TABLE).select("*").eq("id", req.params.id).maybeSingle();
    if (!before) {
      res.status(404).json({ error: "Discrepancy not found." });
      return;
    }
    if (before.status === "resolved") {
      res.status(409).json({ error: "Discrepancy is already resolved." });
      return;
    }
    const { data: row, error } = await supabase
      .from(DISCREPANCIES_TABLE)
      .update({ status: "resolved", resolved_by: parsed.data.actor, resolved_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select("*, directives(reference_no, title)")
      .single();
    if (error) {
      res.status(502).json({ error: `Update failed: ${error.message}` });
      return;
    }
    const status = await syncStatus(before.delivery_event_id);
    await recordAuditEvent({
      actor: parsed.data.actor,
      action: "delivery_discrepancy.resolve",
      entityType: "delivery_discrepancy",
      entityId: req.params.id,
      beforeState: before,
      afterState: row,
    });
    res.json({ discrepancy: fromDiscrepancy(row as DiscrepancyRow), eventStatus: status });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown update error" });
  }
});

/** Final authorizing sign-off. Gated on the records checklist having passed
 * and every discrepancy being resolved — the gate is enforced here, not just
 * by disabling a button in the UI. */
deliveryRouter.post("/events/:id/sign-off", async (req, res) => {
  const parsed = signOffSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: zodError(parsed.error) });
    return;
  }
  try {
    const { data: event } = await supabase.from(DELIVERY_EVENTS_TABLE).select("*").eq("id", req.params.id).maybeSingle();
    if (!event) {
      res.status(404).json({ error: "Delivery event not found." });
      return;
    }
    if (event.signed_off_at) {
      res.status(409).json({ error: "Event is already signed off." });
      return;
    }
    const statuses = await checklistStatuses(event.qc_checklist_instance_id ? [event.qc_checklist_instance_id] : []);
    const checklistStatus = event.qc_checklist_instance_id ? statuses.get(event.qc_checklist_instance_id) : undefined;
    const { data: open } = await supabase
      .from(DISCREPANCIES_TABLE)
      .select("id")
      .eq("delivery_event_id", req.params.id)
      .eq("status", "open");
    const blockers = [
      checklistStatus !== "passed" && `records checklist is ${checklistStatus ?? "missing"}, not passed`,
      (open?.length ?? 0) > 0 && `${open!.length} discrepanc${open!.length === 1 ? "y is" : "ies are"} still open`,
    ].filter(Boolean);
    if (blockers.length) {
      res.status(400).json({ error: `Can't sign off: ${blockers.join("; ")}.` });
      return;
    }
    const signedOffAt = new Date().toISOString();
    const { data: row, error } = await supabase
      .from(DELIVERY_EVENTS_TABLE)
      .update({ signed_off_by: parsed.data.signedOffBy, signed_off_at: signedOffAt, status: "complete" })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) {
      res.status(502).json({ error: `Sign-off failed: ${error.message}` });
      return;
    }
    await recordAuditEvent({
      actor: parsed.data.signedOffBy,
      action: "delivery_event.sign_off",
      entityType: "delivery_event",
      entityId: req.params.id,
      beforeState: event,
      afterState: row,
    });
    res.json(fromEvent(row as EventRow, checklistStatus ?? null, 0));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown sign-off error" });
  }
});
