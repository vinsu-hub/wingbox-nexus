import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { recordAuditEvent } from "../lib/auditLog.js";
import { auditActor } from "../lib/auth.js";
import { assertOwnsRow, scopeQuery, sendError } from "../lib/clientScope.js";

export const ACTIONS_TABLE = "actions";
export const actionsRouter = Router();

const createSchema = z.object({
  subjectType: z.string().min(1),
  subjectId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  ownerId: z.string().uuid().optional(),
  dueDate: z.string().optional(),
  sourceType: z.string().optional(),
  sourceId: z.string().optional(),
  clientId: z.string().uuid().optional(), // only used to derive scoping below, never trusted as-is — see note in the handler
});

const closeSchema = z.object({ closureNote: z.string().min(1, "A closure note is required.") });

const fromRow = (row: Record<string, unknown>) => ({
  id: row.id,
  clientId: row.client_id,
  subjectType: row.subject_type,
  subjectId: row.subject_id,
  title: row.title,
  description: row.description,
  ownerId: row.owner_id,
  dueDate: row.due_date,
  status: row.status,
  sourceType: row.source_type,
  sourceId: row.source_id,
  closedBy: row.closed_by,
  closedAt: row.closed_at,
  closureNote: row.closure_note,
  createdAt: row.created_at,
});

actionsRouter.get("/", async (req, res) => {
  try {
    let query = supabase.from(ACTIONS_TABLE).select("*").order("due_date", { ascending: true, nullsFirst: false });
    if (typeof req.query.status === "string") query = query.eq("status", req.query.status);
    if (typeof req.query.subjectType === "string") query = query.eq("subject_type", req.query.subjectType);
    if (typeof req.query.ownerId === "string") query = query.eq("owner_id", req.query.ownerId);
    query = scopeQuery(query, req.user!);
    const { data, error } = await query;
    if (error) {
      res.status(502).json({ error: `Lookup failed: ${error.message}` });
      return;
    }
    res.json((data ?? []).map(fromRow));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown lookup error" });
  }
});

actionsRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map(i => i.message).join("; ") });
    return;
  }
  try {
    // client_id is never taken directly from the body — a Client-role
    // caller (the only role this would matter for; writes are otherwise
    // staff-only) always gets their own clientId stamped, regardless of
    // what was submitted. Internal staff may action on behalf of any
    // client, or leave it unset for a genuinely internal action.
    const clientId = req.user!.role === "Client" ? req.user!.clientId : (parsed.data.clientId ?? null);
    const { data: row, error } = await supabase
      .from(ACTIONS_TABLE)
      .insert({
        client_id: clientId,
        subject_type: parsed.data.subjectType,
        subject_id: parsed.data.subjectId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        owner_id: parsed.data.ownerId ?? null,
        due_date: parsed.data.dueDate ?? null,
        source_type: parsed.data.sourceType ?? null,
        source_id: parsed.data.sourceId ?? null,
      })
      .select()
      .single();
    if (error) {
      res.status(502).json({ error: `Insert failed: ${error.message}` });
      return;
    }
    await recordAuditEvent({ actor: auditActor(req), action: "action.create", entityType: "action", entityId: row.id, afterState: row });
    res.status(201).json(fromRow(row));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown insert error" });
  }
});

/** Closing requires a closure note — Foundations acceptance criterion,
 * enforced here (not just in the UI) via closeSchema's min(1). */
actionsRouter.post("/:id/close", async (req, res) => {
  const parsed = closeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map(i => i.message).join("; ") });
    return;
  }
  try {
    const { data: before } = await supabase.from(ACTIONS_TABLE).select("*").eq("id", req.params.id).maybeSingle();
    if (!before) {
      res.status(404).json({ error: "Action not found." });
      return;
    }
    assertOwnsRow(req.user!, before as { client_id?: string | null });
    if (before.status === "closed") {
      res.status(409).json({ error: "Action is already closed." });
      return;
    }
    const { data: row, error } = await supabase
      .from(ACTIONS_TABLE)
      .update({ status: "closed", closed_by: req.user!.id, closed_at: new Date().toISOString(), closure_note: parsed.data.closureNote })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) {
      res.status(502).json({ error: `Update failed: ${error.message}` });
      return;
    }
    await recordAuditEvent({
      actor: auditActor(req),
      action: "action.close",
      entityType: "action",
      entityId: req.params.id,
      beforeState: before,
      afterState: row,
    });
    res.json(fromRow(row));
  } catch (err) {
    sendError(res, err, "Unknown update error");
  }
});
