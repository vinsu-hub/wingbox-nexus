import { Router } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { recordAuditEvent } from "../lib/auditLog.js";

export const QC_TEMPLATES_TABLE = "qc_checklist_templates";
export const QC_INSTANCES_TABLE = "qc_checklist_instances";
export const QC_ATTACHMENTS_BUCKET = "qc-attachments";

export const qcRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

const itemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  requiresPhoto: z.boolean().default(false),
});

const templateSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["inspection", "parts", "delivery"]),
  items: z.array(itemSchema).min(1),
});

const linkedEntityType = z.enum(["inspection", "part_request", "aircraft", "delivery"]);

const startInstanceSchema = z.object({
  templateId: z.string().uuid(),
  linkedEntityType,
  linkedEntityId: z.string().min(1),
});

const resultSchema = z.object({
  itemId: z.string().min(1),
  result: z.enum(["pass", "fail", "na"]),
  notes: z.string().optional(),
  photoUrl: z.string().optional(),
});

const submitSchema = z.object({
  results: z.array(resultSchema),
  completedBy: z.string().min(1),
});

type Result = z.infer<typeof resultSchema>;
type Item = z.infer<typeof itemSchema>;

const fromTemplate = (row: Record<string, unknown>) => ({
  id: row.id,
  name: row.name,
  category: row.category,
  items: row.items,
  createdAt: row.created_at,
});

const fromInstance = (row: Record<string, unknown>) => ({
  id: row.id,
  templateId: row.template_id,
  linkedEntityType: row.linked_entity_type,
  linkedEntityId: row.linked_entity_id,
  status: row.status,
  completedBy: row.completed_by,
  completedAt: row.completed_at,
  results: row.results,
  createdAt: row.created_at,
});

const zodError = (error: z.ZodError) => error.issues.map(issue => `${issue.path.join(".") || "body"}: ${issue.message}`).join("; ");

/** Rolls item results up to a checklist status. Every item must have a
 * result; any fail fails the checklist; N/A counts as not-failed. An item
 * flagged requiresPhoto that passes without a photo is treated as
 * incomplete rather than silently passed. */
export function rollUpStatus(items: Item[], results: Result[]): { status: "passed" | "failed"; missing: string[] } {
  const byItem = new Map(results.map(result => [result.itemId, result]));
  const missing = items
    .filter(item => {
      const result = byItem.get(item.id);
      if (!result) return true;
      return item.requiresPhoto && result.result === "pass" && !result.photoUrl;
    })
    .map(item => item.label);
  const failed = results.some(result => result.result === "fail");
  return { status: failed ? "failed" : "passed", missing };
}

qcRouter.get("/templates", async (req, res) => {
  try {
    let query = supabase.from(QC_TEMPLATES_TABLE).select("*").order("name");
    if (typeof req.query.category === "string") query = query.eq("category", req.query.category);
    const { data, error } = await query;
    if (error) {
      res.status(502).json({ error: `Lookup failed: ${error.message}` });
      return;
    }
    res.json((data ?? []).map(fromTemplate));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown lookup error" });
  }
});

qcRouter.post("/templates", async (req, res) => {
  const parsed = templateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: zodError(parsed.error) });
    return;
  }
  try {
    const { data, error } = await supabase.from(QC_TEMPLATES_TABLE).insert(parsed.data).select().single();
    if (error) {
      res.status(502).json({ error: `Insert failed: ${error.message}` });
      return;
    }
    res.status(201).json(fromTemplate(data));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown insert error" });
  }
});

qcRouter.get("/instances", async (req, res) => {
  try {
    let query = supabase.from(QC_INSTANCES_TABLE).select("*").order("created_at", { ascending: false });
    if (typeof req.query.linkedEntityType === "string") query = query.eq("linked_entity_type", req.query.linkedEntityType);
    if (typeof req.query.linkedEntityId === "string") query = query.eq("linked_entity_id", req.query.linkedEntityId);
    const { data, error } = await query;
    if (error) {
      res.status(502).json({ error: `Lookup failed: ${error.message}` });
      return;
    }
    res.json((data ?? []).map(fromInstance));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown lookup error" });
  }
});

qcRouter.get("/instances/:id", async (req, res) => {
  try {
    const { data, error } = await supabase.from(QC_INSTANCES_TABLE).select("*").eq("id", req.params.id).maybeSingle();
    if (error) {
      res.status(502).json({ error: `Lookup failed: ${error.message}` });
      return;
    }
    if (!data) {
      res.status(404).json({ error: "Checklist not found." });
      return;
    }
    res.json(fromInstance(data));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown lookup error" });
  }
});

qcRouter.post("/instances", async (req, res) => {
  const parsed = startInstanceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: zodError(parsed.error) });
    return;
  }
  try {
    const { data, error } = await supabase
      .from(QC_INSTANCES_TABLE)
      .insert({
        template_id: parsed.data.templateId,
        linked_entity_type: parsed.data.linkedEntityType,
        linked_entity_id: parsed.data.linkedEntityId,
      })
      .select()
      .single();
    if (error) {
      res.status(502).json({ error: `Insert failed: ${error.message}` });
      return;
    }
    res.status(201).json(fromInstance(data));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown insert error" });
  }
});

/** Technician submits results. Status is always computed here from the
 * template's items — never accepted from the client — so a checklist can't
 * be marked passed with items missing or failed. */
qcRouter.patch("/instances/:id", async (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: zodError(parsed.error) });
    return;
  }
  try {
    const { data: before, error: lookupError } = await supabase
      .from(QC_INSTANCES_TABLE)
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();
    if (lookupError) {
      res.status(502).json({ error: `Lookup failed: ${lookupError.message}` });
      return;
    }
    if (!before) {
      res.status(404).json({ error: "Checklist not found." });
      return;
    }
    if (before.status !== "in_progress") {
      res.status(409).json({ error: `Checklist is already ${before.status}.` });
      return;
    }
    const { data: template, error: templateError } = await supabase
      .from(QC_TEMPLATES_TABLE)
      .select("items")
      .eq("id", before.template_id)
      .single();
    if (templateError) {
      res.status(502).json({ error: `Template lookup failed: ${templateError.message}` });
      return;
    }

    const items = z.array(itemSchema).parse(template.items);
    const { status, missing } = rollUpStatus(items, parsed.data.results);
    if (missing.length) {
      res.status(400).json({ error: `Incomplete checklist — missing result or required photo for: ${missing.join(", ")}` });
      return;
    }

    const { data: row, error } = await supabase
      .from(QC_INSTANCES_TABLE)
      .update({
        status,
        results: parsed.data.results,
        completed_by: parsed.data.completedBy,
        completed_at: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) {
      res.status(502).json({ error: `Update failed: ${error.message}` });
      return;
    }

    await recordAuditEvent({
      actor: parsed.data.completedBy,
      action: "qc_checklist.complete",
      entityType: "qc_checklist_instance",
      entityId: req.params.id,
      beforeState: before,
      afterState: row,
    });
    res.json(fromInstance(row));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown update error" });
  }
});

qcRouter.post("/attachments", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Provide a multipart 'file'." });
      return;
    }
    if (!req.file.mimetype.startsWith("image/")) {
      res.status(400).json({ error: "Only image attachments are accepted." });
      return;
    }
    const extension = req.file.originalname.includes(".") ? req.file.originalname.slice(req.file.originalname.lastIndexOf(".")) : "";
    const path = `${randomUUID()}${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(QC_ATTACHMENTS_BUCKET)
      .upload(path, req.file.buffer, { contentType: req.file.mimetype });
    if (uploadError) {
      res.status(502).json({ error: `Upload failed: ${uploadError.message}` });
      return;
    }
    const { data: signed, error: signError } = await supabase.storage
      .from(QC_ATTACHMENTS_BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 7);
    if (signError || !signed) {
      res.status(502).json({ error: `Could not sign URL: ${signError?.message}` });
      return;
    }
    res.status(201).json({ path, url: signed.signedUrl });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown upload error" });
  }
});
