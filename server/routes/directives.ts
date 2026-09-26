import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { recordAuditEvent } from "../lib/auditLog.js";
import { auditActor, requireRole } from "../lib/auth.js";

export const DIRECTIVES_TABLE = "directives";
export const COMPLIANCE_RECORDS_TABLE = "directive_compliance_records";

export const directivesRouter = Router();

const directiveSchema = z.object({
  type: z.enum(["AD", "SB"]),
  referenceNo: z.string().min(1),
  title: z.string().min(1),
  applicability: z.string().optional(),
  issuingAuthority: z.string().optional(),
  effectiveDate: z.string().optional(),
  complianceDue: z.string().optional(),
  status: z.enum(["open", "in_progress", "complied", "not_applicable"]).default("open"),
  ataChapter: z.string().optional(),
  notes: z.string().optional(),
});

const complianceRecordSchema = z.object({
  tailNumber: z.string().min(1),
  status: z.enum(["Compliant", "Due Soon", "Overdue", "N/A"]),
  compliedDate: z.string().optional(),
  compliedBy: z.string().optional(),
  signedOffBy: z.string().optional(),
  referenceDocUrl: z.string().optional(),
  actor: z.string().optional(),
});

function toDbDirective(input: z.infer<typeof directiveSchema>) {
  return {
    type: input.type,
    reference_no: input.referenceNo,
    title: input.title,
    applicability: input.applicability || null,
    issuing_authority: input.issuingAuthority || null,
    effective_date: input.effectiveDate || null,
    compliance_due: input.complianceDue || null,
    status: input.status,
    ata_chapter: input.ataChapter || null,
    notes: input.notes || null,
  };
}

function fromDbDirective(row: Record<string, unknown>) {
  return {
    id: row.id,
    type: row.type,
    referenceNo: row.reference_no,
    title: row.title,
    applicability: row.applicability,
    issuingAuthority: row.issuing_authority,
    effectiveDate: row.effective_date,
    complianceDue: row.compliance_due,
    status: row.status,
    ataChapter: row.ata_chapter,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function fromDbRecord(row: Record<string, unknown>) {
  return {
    id: row.id,
    directiveId: row.directive_id,
    tailNumber: row.tail_number,
    status: row.status,
    compliedDate: row.complied_date,
    compliedBy: row.complied_by,
    signedOffBy: row.signed_off_by,
    referenceDocUrl: row.reference_doc_url,
  };
}

/** Lists every directive with its nested per-aircraft compliance records —
 * the client reshapes this into the full N/A-filled matrix it renders,
 * same as the mock data module it replaces did. Fleet size here is small
 * enough that fetching everything and filtering client-side (matching the
 * rest of this app's existing pages) is simpler than adding pagination. */
directivesRouter.get("/", async (_req, res) => {
  try {
    const { data: directiveRows, error: directivesError } = await supabase
      .from(DIRECTIVES_TABLE)
      .select("*")
      .order("compliance_due", { ascending: true });
    if (directivesError) {
      res.status(502).json({ error: `Lookup failed: ${directivesError.message}` });
      return;
    }
    const { data: recordRows, error: recordsError } = await supabase
      .from(COMPLIANCE_RECORDS_TABLE)
      .select("*");
    if (recordsError) {
      res.status(502).json({ error: `Lookup failed: ${recordsError.message}` });
      return;
    }
    const recordsByDirective = new Map<string, Record<string, unknown>[]>();
    for (const row of recordRows ?? []) {
      const key = String(row.directive_id);
      if (!recordsByDirective.has(key)) recordsByDirective.set(key, []);
      recordsByDirective.get(key)!.push(row);
    }
    res.json(
      (directiveRows ?? []).map(row => ({
        ...fromDbDirective(row),
        records: (recordsByDirective.get(String(row.id)) ?? []).map(fromDbRecord),
      })),
    );
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown lookup error" });
  }
});

directivesRouter.get("/:id", async (req, res) => {
  try {
    const { data: row, error } = await supabase
      .from(DIRECTIVES_TABLE)
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();
    if (error) {
      res.status(502).json({ error: `Lookup failed: ${error.message}` });
      return;
    }
    if (!row) {
      res.status(404).json({ error: "Directive not found." });
      return;
    }
    const { data: records, error: recordsError } = await supabase
      .from(COMPLIANCE_RECORDS_TABLE)
      .select("*")
      .eq("directive_id", req.params.id);
    if (recordsError) {
      res.status(502).json({ error: `Lookup failed: ${recordsError.message}` });
      return;
    }
    res.json({ ...fromDbDirective(row), records: (records ?? []).map(fromDbRecord) });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown lookup error" });
  }
});

directivesRouter.post("/", requireRole("Admin", "Engineer"), async (req, res) => {
  const parsed = directiveSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map(issue => issue.message).join("; ") });
    return;
  }
  try {
    const { data: row, error } = await supabase
      .from(DIRECTIVES_TABLE)
      .insert(toDbDirective(parsed.data))
      .select()
      .single();
    if (error) {
      res.status(502).json({ error: `Insert failed: ${error.message}` });
      return;
    }
    res.status(201).json({ ...fromDbDirective(row), records: [] });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown insert error" });
  }
});

const PARTIAL_FIELD_TO_COLUMN: Record<string, string> = {
  type: "type",
  referenceNo: "reference_no",
  title: "title",
  applicability: "applicability",
  issuingAuthority: "issuing_authority",
  effectiveDate: "effective_date",
  complianceDue: "compliance_due",
  status: "status",
  ataChapter: "ata_chapter",
  notes: "notes",
};

directivesRouter.patch("/:id", requireRole("Admin", "Engineer"), async (req, res) => {
  const parsed = directiveSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map(issue => issue.message).join("; ") });
    return;
  }
  if (Object.keys(parsed.data).length === 0) {
    res.status(400).json({ error: "Provide at least one field to update." });
    return;
  }
  try {
    const updates: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(parsed.data)) {
      const column = PARTIAL_FIELD_TO_COLUMN[field];
      if (column) updates[column] = value;
    }
    const { data: before } = await supabase.from(DIRECTIVES_TABLE).select("*").eq("id", req.params.id).maybeSingle();
    const { data: row, error } = await supabase
      .from(DIRECTIVES_TABLE)
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) {
      res.status(502).json({ error: `Update failed: ${error.message}` });
      return;
    }
    await recordAuditEvent({
      actor: auditActor(req),
      action: "directive.update",
      entityType: "directive",
      entityId: req.params.id,
      beforeState: before,
      afterState: row,
    });
    res.json(fromDbDirective(row));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown update error" });
  }
});

/** Marks (or updates) a directive's compliance status for one aircraft.
 * Upserts on (directive_id, tail_number) so this doubles as both "mark as
 * complied" and "correct a status" without a separate endpoint. Same
 * complied_by/signed_off_by returns a warning rather than a hard block —
 * small teams may need the override. */
directivesRouter.post("/:id/compliance-records", async (req, res) => {
  const parsed = complianceRecordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map(issue => issue.message).join("; ") });
    return;
  }
  const { tailNumber, status, compliedDate, compliedBy, signedOffBy, referenceDocUrl } = parsed.data;
  try {
    const { data: before } = await supabase
      .from(COMPLIANCE_RECORDS_TABLE)
      .select("*")
      .eq("directive_id", req.params.id)
      .eq("tail_number", tailNumber)
      .maybeSingle();

    const { data: row, error } = await supabase
      .from(COMPLIANCE_RECORDS_TABLE)
      .upsert(
        {
          directive_id: req.params.id,
          tail_number: tailNumber,
          status,
          complied_date: compliedDate || null,
          complied_by: compliedBy || null,
          signed_off_by: signedOffBy || null,
          reference_doc_url: referenceDocUrl || null,
        },
        { onConflict: "directive_id,tail_number" },
      )
      .select()
      .single();
    if (error) {
      res.status(502).json({ error: `Upsert failed: ${error.message}` });
      return;
    }

    await recordAuditEvent({
      actor: auditActor(req),
      action: "directive.compliance_record.upsert",
      entityType: "directive_compliance_record",
      entityId: row.id,
      beforeState: before ?? null,
      afterState: row,
    });

    const warning =
      compliedBy && signedOffBy && compliedBy.trim().toLowerCase() === signedOffBy.trim().toLowerCase()
        ? "complied_by and signed_off_by are the same person — normally these should be different people."
        : undefined;

    res.status(before ? 200 : 201).json({ ...fromDbRecord(row), warning });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown upsert error" });
  }
});
