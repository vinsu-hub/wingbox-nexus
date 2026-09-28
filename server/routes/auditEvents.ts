import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireRole } from "../lib/auth.js";

export const AUDIT_EVENTS_TABLE = "audit_events";
export const auditEventsRouter = Router();

const PAGE_SIZE_DEFAULT = 50;
const PAGE_SIZE_MAX = 200;

/** Admin/QA only — matches the Foundations spec exactly ("Read-only, Admin
 * and QA"). audit_events is intentionally not client-scoped (see
 * 0008_clients.sql); restricting the whole router to internal roles is what
 * satisfies "a Client user cannot read another client's rows" here, since
 * Client never reaches this router at all. */
auditEventsRouter.get("/", requireRole("Admin", "QA"), async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, Number(req.query.pageSize) || PAGE_SIZE_DEFAULT));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from(AUDIT_EVENTS_TABLE).select("*", { count: "exact" }).order("timestamp", { ascending: false }).range(from, to);
    if (typeof req.query.actor === "string" && req.query.actor) query = query.ilike("actor", `%${req.query.actor}%`);
    if (typeof req.query.entityType === "string" && req.query.entityType) query = query.eq("entity_type", req.query.entityType);
    if (typeof req.query.action === "string" && req.query.action) query = query.ilike("action", `%${req.query.action}%`);
    if (typeof req.query.from === "string" && req.query.from) query = query.gte("timestamp", req.query.from);
    if (typeof req.query.to === "string" && req.query.to) query = query.lte("timestamp", req.query.to);

    const { data, error, count } = await query;
    if (error) {
      res.status(502).json({ error: `Lookup failed: ${error.message}` });
      return;
    }
    res.json({
      events: (data ?? []).map(row => ({
        id: row.id,
        actor: row.actor,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        beforeState: row.before_state,
        afterState: row.after_state,
        timestamp: row.timestamp,
      })),
      page,
      pageSize,
      total: count ?? 0,
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown lookup error" });
  }
});

/** Every distinct entity_type on record, for the filter dropdown — cheaper
 * than shipping the whole table to the client to compute it. */
auditEventsRouter.get("/entity-types", requireRole("Admin", "QA"), async (_req, res) => {
  try {
    const { data, error } = await supabase.from(AUDIT_EVENTS_TABLE).select("entity_type");
    if (error) {
      res.status(502).json({ error: `Lookup failed: ${error.message}` });
      return;
    }
    res.json(Array.from(new Set((data ?? []).map(row => row.entity_type as string))).sort());
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown lookup error" });
  }
});
