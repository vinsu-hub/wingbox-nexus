import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { recordAuditEvent } from "../lib/auditLog.js";
import { auditActor, requireRole } from "../lib/auth.js";
import { SETTINGS_TABLE, SETTINGS_KEYS } from "../lib/settings.js";

export const settingsRouter = Router();

// The known, editable keys — a request naming any other key is rejected
// rather than silently creating a new row. Values are validated per-key so
// a bad request can't silently corrupt a threshold Life Tracking depends on.
const KEY_SCHEMAS: Record<string, z.ZodType> = {
  [SETTINGS_KEYS.approachingThresholdPct]: z.number().min(0).max(100),
  [SETTINGS_KEYS.dueSoonUsedPct]: z.number().min(0).max(100),
  [SETTINGS_KEYS.overdueUsedPct]: z.number().min(0).max(200),
};

const updateSchema = z.object({ value: z.unknown() });

/** Every authenticated role can read settings (thresholds are useful
 * context, not sensitive) — only Admin can change them. */
settingsRouter.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase.from(SETTINGS_TABLE).select("*").order("key");
    if (error) {
      res.status(502).json({ error: `Lookup failed: ${error.message}` });
      return;
    }
    res.json(
      (data ?? []).map(row => ({
        key: row.key,
        value: row.value,
        updatedBy: row.updated_by,
        updatedAt: row.updated_at,
      })),
    );
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown lookup error" });
  }
});

settingsRouter.patch("/:key", requireRole("Admin"), async (req, res) => {
  const schema = KEY_SCHEMAS[req.params.key];
  if (!schema) {
    res.status(404).json({ error: `Unknown setting key: ${req.params.key}` });
    return;
  }
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Provide a 'value' field." });
    return;
  }
  const valueParsed = schema.safeParse(parsed.data.value);
  if (!valueParsed.success) {
    res.status(400).json({ error: valueParsed.error.issues.map(i => i.message).join("; ") });
    return;
  }
  try {
    const { data: before } = await supabase.from(SETTINGS_TABLE).select("*").eq("key", req.params.key).maybeSingle();
    const { data: row, error } = await supabase
      .from(SETTINGS_TABLE)
      .upsert({ key: req.params.key, value: valueParsed.data, updated_by: req.user!.displayName, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) {
      res.status(502).json({ error: `Update failed: ${error.message}` });
      return;
    }
    await recordAuditEvent({
      actor: auditActor(req),
      action: "settings.update",
      entityType: "setting",
      entityId: req.params.key,
      beforeState: before,
      afterState: row,
    });
    res.json({ key: row.key, value: row.value, updatedBy: row.updated_by, updatedAt: row.updated_at });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown update error" });
  }
});
