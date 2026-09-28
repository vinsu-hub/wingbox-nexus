import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { recordAuditEvent } from "../lib/auditLog.js";
import { auditActor } from "../lib/auth.js";
import { assertOwnsRow, scopeQuery, sendError } from "../lib/clientScope.js";

export const REVIEW_ITEMS_TABLE = "review_items";
export const reviewItemsRouter = Router();

// Foundations builds the skeleton only — no phase writes to this table yet,
// so this list is deliberately empty in a fresh environment. Later phases
// (Records/Box extractions, Predictive/AI predictions, CAMO configuration
// mismatches, ...) each add their own `kind` here without new plumbing.
const decideSchema = z.object({ note: z.string().optional() });

const fromRow = (row: Record<string, unknown>) => ({
  id: row.id,
  clientId: row.client_id,
  kind: row.kind,
  subjectType: row.subject_type,
  subjectId: row.subject_id,
  status: row.status,
  reviewedBy: row.reviewed_by,
  reviewedAt: row.reviewed_at,
  payload: row.payload,
  createdAt: row.created_at,
});

reviewItemsRouter.get("/", async (req, res) => {
  try {
    let query = supabase.from(REVIEW_ITEMS_TABLE).select("*").order("created_at", { ascending: false });
    if (typeof req.query.kind === "string") query = query.eq("kind", req.query.kind);
    if (typeof req.query.status === "string") query = query.eq("status", req.query.status);
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

/** The kinds currently present, for the tab strip — empty until a later
 * phase starts writing rows. */
reviewItemsRouter.get("/kinds", async (req, res) => {
  try {
    let query = supabase.from(REVIEW_ITEMS_TABLE).select("kind");
    query = scopeQuery(query, req.user!);
    const { data, error } = await query;
    if (error) {
      res.status(502).json({ error: `Lookup failed: ${error.message}` });
      return;
    }
    res.json(Array.from(new Set((data ?? []).map(row => row.kind as string))).sort());
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown lookup error" });
  }
});

async function decide(req: Request, res: Response, status: "accepted" | "rejected") {
  try {
    const { data: before } = await supabase.from(REVIEW_ITEMS_TABLE).select("*").eq("id", req.params.id).maybeSingle();
    if (!before) {
      res.status(404).json({ error: "Review item not found." });
      return;
    }
    assertOwnsRow(req.user!, before as { client_id?: string | null });
    if (before.status !== "pending") {
      res.status(409).json({ error: `Already ${before.status}.` });
      return;
    }
    const { data: row, error } = await supabase
      .from(REVIEW_ITEMS_TABLE)
      .update({ status, reviewed_by: req.user!.id, reviewed_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) {
      res.status(502).json({ error: `Update failed: ${error.message}` });
      return;
    }
    await recordAuditEvent({
      actor: auditActor(req),
      action: `review_item.${status}`,
      entityType: "review_item",
      entityId: req.params.id,
      beforeState: before,
      afterState: row,
    });
    res.json(fromRow(row));
  } catch (err) {
    sendError(res, err, "Unknown update error");
  }
}

reviewItemsRouter.post("/:id/accept", async (req, res) => {
  const parsed = decideSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body." });
    return;
  }
  await decide(req, res, "accepted");
});

reviewItemsRouter.post("/:id/reject", async (req, res) => {
  const parsed = decideSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body." });
    return;
  }
  await decide(req, res, "rejected");
});
