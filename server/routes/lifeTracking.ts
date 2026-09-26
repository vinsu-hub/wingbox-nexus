import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { recordAuditEvent } from "../lib/auditLog.js";
import { auditActor } from "../lib/auth.js";
import { APPROACHING_THRESHOLD, evaluateComponent, evaluateLimit, type LimitRow } from "../lib/lifeTracking.js";

export const COMPONENTS_TABLE = "components";
export const LIMITS_TABLE = "component_life_limits";

export const lifeTrackingRouter = Router();

const readingSchema = z.object({
  currentValue: z.number().nonnegative(),
  actor: z.string().optional(),
});

const acknowledgeSchema = z.object({ actor: z.string().optional() });

interface ComponentRow {
  id: string;
  aircraft_tail: string;
  part_number: string;
  serial_number: string;
  description: string;
  ata_chapter: string | null;
  install_date: string;
  component_life_limits: LimitRow[];
}

const COMPONENT_SELECT = "*, component_life_limits(*)";

function toApiComponent(row: ComponentRow, now: Date) {
  return {
    id: row.id,
    tail: row.aircraft_tail,
    partNumber: row.part_number,
    serialNumber: row.serial_number,
    description: row.description,
    ataChapter: row.ata_chapter,
    installDate: row.install_date,
    ...evaluateComponent(row.component_life_limits, row.install_date, now),
  };
}

const zodError = (error: z.ZodError) => error.issues.map(issue => `${issue.path.join(".") || "body"}: ${issue.message}`).join("; ");

async function loadComponents(tail?: string) {
  let query = supabase.from(COMPONENTS_TABLE).select(COMPONENT_SELECT).order("aircraft_tail").order("description");
  if (tail) query = query.eq("aircraft_tail", tail);
  const { data, error } = await query;
  if (error) throw new Error(`Lookup failed: ${error.message}`);
  const now = new Date();
  return (data as ComponentRow[]).map(row => toApiComponent(row, now));
}

/** Components with every limit evaluated and the binding constraint flagged.
 * Evaluation happens here, not in the client, so there's exactly one
 * implementation of the binding-constraint rule. */
lifeTrackingRouter.get("/components", async (req, res) => {
  try {
    res.json(await loadComponents(typeof req.query.tail === "string" ? req.query.tail : undefined));
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Unknown lookup error" });
  }
});

lifeTrackingRouter.get("/components/:id", async (req, res) => {
  try {
    const { data, error } = await supabase.from(COMPONENTS_TABLE).select(COMPONENT_SELECT).eq("id", req.params.id).maybeSingle();
    if (error) {
      res.status(502).json({ error: `Lookup failed: ${error.message}` });
      return;
    }
    if (!data) {
      res.status(404).json({ error: "Component not found." });
      return;
    }
    res.json(toApiComponent(data as ComponentRow, new Date()));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown lookup error" });
  }
});

/** Fleet rollup for the Dashboard: how many components' binding constraint
 * is within the approaching-threshold window, and how many are past it. */
lifeTrackingRouter.get("/summary", async (_req, res) => {
  try {
    const components = await loadComponents();
    const withBinding = components.filter(component => component.bindingRemainingPct !== null);
    res.json({
      total: components.length,
      threshold: APPROACHING_THRESHOLD,
      approaching: withBinding.filter(c => c.bindingRemainingPct! > 0 && c.bindingRemainingPct! <= APPROACHING_THRESHOLD).length,
      overdue: withBinding.filter(c => c.bindingRemainingPct! <= 0).length,
    });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Unknown lookup error" });
  }
});

async function loadLimitWithInstall(limitId: string) {
  const { data, error } = await supabase
    .from(LIMITS_TABLE)
    .select("*, components(install_date, aircraft_tail, description)")
    .eq("id", limitId)
    .maybeSingle();
  if (error) throw new Error(`Lookup failed: ${error.message}`);
  return data as (LimitRow & { component_id: string; components: { install_date: string; aircraft_tail: string; description: string } }) | null;
}

/** Manual hours/cycles entry — the only way usage changes until a flight-ops
 * feed exists. Calendar limits derive from install date and can't be edited. */
lifeTrackingRouter.patch("/limits/:id", async (req, res) => {
  const parsed = readingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: zodError(parsed.error) });
    return;
  }
  try {
    const before = await loadLimitWithInstall(req.params.id);
    if (!before) {
      res.status(404).json({ error: "Limit not found." });
      return;
    }
    if (before.limit_type === "calendar_months") {
      res.status(400).json({ error: "Calendar limits are computed from the install date and can't be edited." });
      return;
    }
    if (parsed.data.currentValue < Number(before.current_value)) {
      res.status(400).json({ error: `New reading (${parsed.data.currentValue}) is lower than the last recorded value (${Number(before.current_value)}).` });
      return;
    }
    const { data: row, error } = await supabase
      .from(LIMITS_TABLE)
      .update({ current_value: parsed.data.currentValue, last_updated: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) {
      res.status(502).json({ error: `Update failed: ${error.message}` });
      return;
    }
    await recordAuditEvent({
      actor: auditActor(req),
      action: "life_limit.reading_update",
      entityType: "component_life_limit",
      entityId: req.params.id,
      beforeState: { current_value: before.current_value, component: before.components.description, tail: before.components.aircraft_tail },
      afterState: { current_value: row.current_value },
    });
    res.json(evaluateLimit(row as LimitRow, before.components.install_date));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown update error" });
  }
});

/** Records that someone has seen an at-risk limit. Only allowed once the
 * limit is actually inside the approaching-threshold window. */
lifeTrackingRouter.post("/limits/:id/acknowledge", async (req, res) => {
  const parsed = acknowledgeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: zodError(parsed.error) });
    return;
  }
  try {
    const before = await loadLimitWithInstall(req.params.id);
    if (!before) {
      res.status(404).json({ error: "Limit not found." });
      return;
    }
    const evaluated = evaluateLimit(before, before.components.install_date);
    if (!evaluated.approachingThreshold) {
      res.status(400).json({ error: `Limit still has ${Math.round(evaluated.remainingPct * 100)}% life remaining — nothing to acknowledge yet.` });
      return;
    }
    const acknowledgedAt = new Date().toISOString();
    const { error } = await supabase
      .from(LIMITS_TABLE)
      .update({ acknowledged_by: req.user!.displayName, acknowledged_at: acknowledgedAt })
      .eq("id", req.params.id);
    if (error) {
      res.status(502).json({ error: `Update failed: ${error.message}` });
      return;
    }
    await recordAuditEvent({
      actor: auditActor(req),
      action: "life_limit.threshold_acknowledged",
      entityType: "component_life_limit",
      entityId: req.params.id,
      beforeState: { acknowledged_by: before.acknowledged_by, acknowledged_at: before.acknowledged_at },
      afterState: { acknowledged_by: req.user!.displayName, acknowledged_at: acknowledgedAt, used_pct: Math.round(evaluated.usedPct) },
    });
    res.json({ ...evaluated, acknowledgedBy: req.user!.displayName, acknowledgedAt });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown acknowledge error" });
  }
});
